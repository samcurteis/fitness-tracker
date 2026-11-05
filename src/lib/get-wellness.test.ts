import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import {
  getWellness,
  IntervalsUnavailable,
  InvalidKey,
  parseErrorDigest,
  RateLimited,
} from "./get-wellness";

const WELLNESS = "https://intervals.icu/api/v1/athlete/0/wellness";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

const range = { oldest: "2026-10-01", newest: "2026-10-03" };

describe("getWellness", () => {
  test("requests wellness with Basic auth and the date range", async () => {
    let seen: Request | undefined;
    server.use(
      http.get("https://intervals.icu/api/v1/athlete/0/wellness", ({ request }) => {
        seen = request;
        return HttpResponse.json([]);
      }),
    );

    await getWellness("secret-key", range);

    const url = new URL(seen!.url);
    expect(url.searchParams.get("oldest")).toBe("2026-10-01");
    expect(url.searchParams.get("newest")).toBe("2026-10-03");
    expect(url.searchParams.get("fields")).toBe("id,ctl,atl");
    expect(seen!.headers.get("authorization")).toBe(
      `Basic ${btoa("API_KEY:secret-key")}`,
    );
  });

  test("uses INTERVALS_BASE_URL when set", async () => {
    vi.stubEnv("INTERVALS_BASE_URL", "http://stub.test");
    server.use(
      http.get("http://stub.test/api/v1/athlete/0/wellness", () =>
        HttpResponse.json([{ id: "2026-10-01", ctl: 1, atl: 2 }]),
      ),
    );

    await expect(getWellness("k", range)).resolves.toHaveLength(1);
  });

  test("200 returns one row per day with Fitness and Fatigue, nulls preserved", async () => {
    server.use(
      http.get("https://intervals.icu/api/v1/athlete/0/wellness", () =>
        HttpResponse.json([
          { id: "2026-10-01", ctl: 48.2, atl: 55.9 },
          { id: "2026-10-02", ctl: null, atl: null },
          { id: "2026-10-03" },
        ]),
      ),
    );

    expect(await getWellness("k", range)).toEqual([
      { date: "2026-10-01", fitness: 48.2, fatigue: 55.9 },
      { date: "2026-10-02", fitness: null, fatigue: null },
      { date: "2026-10-03", fitness: null, fatigue: null },
    ]);
  });

  test("401 throws InvalidKey", async () => {
    server.use(
      http.get("https://intervals.icu/api/v1/athlete/0/wellness", () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );

    await expect(getWellness("bad", range)).rejects.toBeInstanceOf(InvalidKey);
  });

  test("429 with Retry-After: 120 throws RateLimited carrying 2 minutes", async () => {
    server.use(
      http.get(WELLNESS, () =>
        new HttpResponse(null, { status: 429, headers: { "Retry-After": "120" } }),
      ),
    );

    const error = await getWellness("k", range).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RateLimited);
    expect((error as RateLimited).retryAfterMinutes).toBe(2);
    expect(parseErrorDigest((error as RateLimited).digest)).toEqual({
      kind: "rate-limited",
      retryAfterMinutes: 2,
    });
  });

  test("429 rounds Retry-After up to whole minutes, defaulting to 1", async () => {
    server.use(
      http.get(WELLNESS, () =>
        new HttpResponse(null, { status: 429, headers: { "Retry-After": "61" } }),
      ),
    );
    await expect(getWellness("k", range)).rejects.toMatchObject({ retryAfterMinutes: 2 });

    server.use(http.get(WELLNESS, () => new HttpResponse(null, { status: 429 })));
    await expect(getWellness("k", range)).rejects.toMatchObject({ retryAfterMinutes: 1 });
  });

  test.each([500, 502, 503])("%i throws IntervalsUnavailable", async (status) => {
    server.use(http.get(WELLNESS, () => new HttpResponse(null, { status })));

    const error = await getWellness("k", range).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(IntervalsUnavailable);
    expect(parseErrorDigest((error as IntervalsUnavailable).digest)).toEqual({
      kind: "unavailable",
    });
  });

  test("a network error throws IntervalsUnavailable", async () => {
    server.use(http.get(WELLNESS, () => HttpResponse.error()));

    await expect(getWellness("k", range)).rejects.toBeInstanceOf(IntervalsUnavailable);
  });

  test("no response within the ~10s timeout throws IntervalsUnavailable", async () => {
    const realTimeout = AbortSignal.timeout.bind(AbortSignal);
    const timeout = vi
      .spyOn(AbortSignal, "timeout")
      .mockImplementation(() => realTimeout(20)); // stand in for 10s
    server.use(
      http.get(WELLNESS, async () => {
        await delay("infinite");
        return HttpResponse.json([]);
      }),
    );

    await expect(getWellness("k", range)).rejects.toBeInstanceOf(IntervalsUnavailable);
    expect(timeout).toHaveBeenCalledWith(10_000);
    timeout.mockRestore();
  });

  test("an empty array returns [] without throwing", async () => {
    server.use(http.get(WELLNESS, () => HttpResponse.json([])));

    await expect(getWellness("k", range)).resolves.toEqual([]);
  });
});

describe("parseErrorDigest", () => {
  test("ignores digests that are not intervals.icu failures", () => {
    expect(parseErrorDigest(undefined)).toBeUndefined();
    expect(parseErrorDigest("1234567")).toBeUndefined();
    expect(parseErrorDigest("intervals:rate-limited:abc")).toBeUndefined();
  });
});
