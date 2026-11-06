import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import {
  getWellness,
  IntervalsUnavailable,
  InvalidKey,
  RateLimited,
  retryAfterMinutes,
  TIMEOUT_MS,
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

    const err = await getWellness("k", range).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RateLimited);
    expect((err as RateLimited).minutes).toBe(2);
  });

  test("429 without Retry-After throws RateLimited with unknown minutes", async () => {
    server.use(http.get(WELLNESS, () => new HttpResponse(null, { status: 429 })));

    const err = await getWellness("k", range).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RateLimited);
    expect((err as RateLimited).minutes).toBeUndefined();
  });

  test.each([500, 502, 503])("%i throws IntervalsUnavailable", async (status) => {
    server.use(http.get(WELLNESS, () => new HttpResponse(null, { status })));

    await expect(getWellness("k", range)).rejects.toBeInstanceOf(IntervalsUnavailable);
  });

  test("a network error throws IntervalsUnavailable", async () => {
    server.use(http.get(WELLNESS, () => HttpResponse.error()));

    await expect(getWellness("k", range)).rejects.toBeInstanceOf(IntervalsUnavailable);
  });

  test("no response before the timeout throws IntervalsUnavailable", async () => {
    server.use(
      http.get(WELLNESS, async () => {
        await delay("infinite");
        return HttpResponse.json([]);
      }),
    );

    await expect(getWellness("k", range, { timeoutMs: 50 })).rejects.toBeInstanceOf(
      IntervalsUnavailable,
    );
  });

  test("the default timeout is 10s", () => {
    expect(TIMEOUT_MS).toBe(10_000);
  });

  test("an empty array returns [] without throwing", async () => {
    server.use(http.get(WELLNESS, () => HttpResponse.json([])));

    await expect(getWellness("k", range)).resolves.toEqual([]);
  });
});

describe("retryAfterMinutes", () => {
  const now = new Date("2026-11-06T12:00:00Z");

  test.each([
    ["120", 2],
    ["90", 2],
    ["1", 1],
    ["0", 1],
  ])("%s seconds → %i min (rounded up, minimum 1)", (header, minutes) => {
    expect(retryAfterMinutes(header, now)).toBe(minutes);
  });

  test("an HTTP-date is relative to now", () => {
    expect(retryAfterMinutes("Fri, 06 Nov 2026 12:03:30 GMT", now)).toBe(4);
    expect(retryAfterMinutes("Fri, 06 Nov 2026 11:00:00 GMT", now)).toBe(1);
  });

  test.each([null, "", "soon"])("%j → undefined", (header) => {
    expect(retryAfterMinutes(header, now)).toBeUndefined();
  });
});
