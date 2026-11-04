import { beforeEach, describe, expect, test, vi } from "vitest";
import { InvalidKey } from "@/lib/get-wellness";
import { KEY_COOKIE, KEY_COOKIE_MAX_AGE, TZ_COOKIE } from "@/lib/key-cookie";

const cookieStore = { set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const getWellness = vi.fn();
vi.mock("@/lib/get-wellness", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/get-wellness")>()),
  getWellness: (...args: unknown[]) => getWellness(...args),
}));

const today = vi.fn((tz?: string) => (tz === "Australia/Sydney" ? "2026-11-04" : "2026-11-03"));
vi.mock("@/lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/dates")>()),
  today: (tz?: string) => today(tz),
}));

const { submitKey, forgetKey } = await import("./key-actions");

function formWith(key: string, tz?: string) {
  const data = new FormData();
  data.set("key", key);
  if (tz !== undefined) data.set("tz", tz);
  return data;
}

beforeEach(() => vi.clearAllMocks());

describe("submitKey", () => {
  test("validates with one wellness call for today", async () => {
    getWellness.mockResolvedValue([]);
    await submitKey({}, formWith("good-key"));
    expect(getWellness).toHaveBeenCalledExactlyOnceWith("good-key", {
      oldest: "2026-11-03",
      newest: "2026-11-03",
    });
  });

  test("on OK sets a Secure, HttpOnly, SameSite=Lax cookie for ~1 year", async () => {
    getWellness.mockResolvedValue([]);
    expect(await submitKey({}, formWith("good-key"))).toEqual({});
    expect(cookieStore.set).toHaveBeenCalledExactlyOnceWith(
      KEY_COOKIE,
      "good-key",
      expect.objectContaining({
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        maxAge: KEY_COOKIE_MAX_AGE,
      }),
    );
    expect(KEY_COOKIE_MAX_AGE).toBe(365 * 24 * 60 * 60);
  });

  test("validates against today in the Athlete's time zone and stores it", async () => {
    getWellness.mockResolvedValue([]);
    await submitKey({}, formWith("good-key", "Australia/Sydney"));
    expect(getWellness).toHaveBeenCalledWith("good-key", {
      oldest: "2026-11-04",
      newest: "2026-11-04",
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      TZ_COOKIE,
      "Australia/Sydney",
      expect.objectContaining({ httpOnly: true, maxAge: KEY_COOKIE_MAX_AGE }),
    );
  });

  test("ignores an unknown time zone and stores no tz cookie", async () => {
    getWellness.mockResolvedValue([]);
    await submitKey({}, formWith("good-key", "Not/AZone"));
    expect(today).toHaveBeenCalledWith(undefined);
    expect(cookieStore.set).toHaveBeenCalledExactlyOnceWith(
      KEY_COOKIE,
      "good-key",
      expect.anything(),
    );
  });

  test("on 401 returns an inline error and sets no cookie", async () => {
    getWellness.mockRejectedValue(new InvalidKey());
    expect(await submitKey({}, formWith("bad-key"))).toEqual({
      error: "intervals.icu rejected this key",
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  test("an empty key returns an error without calling intervals.icu", async () => {
    const result = await submitKey({}, formWith("  "));
    expect(result.error).toBeTruthy();
    expect(getWellness).not.toHaveBeenCalled();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});

describe("forgetKey", () => {
  test("deletes the key and tz cookies", async () => {
    await forgetKey();
    expect(cookieStore.delete).toHaveBeenCalledWith(KEY_COOKIE);
    expect(cookieStore.delete).toHaveBeenCalledWith(TZ_COOKIE);
  });
});
