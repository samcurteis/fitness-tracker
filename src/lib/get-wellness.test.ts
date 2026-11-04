import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { getWellness, InvalidKey } from "./get-wellness";

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
});
