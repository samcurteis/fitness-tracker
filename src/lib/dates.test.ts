import { afterEach, describe, expect, test, vi } from "vitest";
import { isValidTimeZone, oneYearBefore, today } from "./dates";

afterEach(() => vi.useRealTimers());

describe("today", () => {
  test("is the date in the given time zone, not UTC", () => {
    vi.useFakeTimers({ now: new Date("2026-07-01T23:30:00Z") });
    expect(today("UTC")).toBe("2026-07-01");
    expect(today("Europe/London")).toBe("2026-07-02"); // BST, UTC+1
    expect(today("Australia/Sydney")).toBe("2026-07-02");
    expect(today("America/Los_Angeles")).toBe("2026-07-01");
  });

  test("falls back to UTC when the time zone is missing or unknown", () => {
    vi.useFakeTimers({ now: new Date("2026-07-01T23:30:00Z") });
    expect(today()).toBe("2026-07-01");
    expect(today("Not/AZone")).toBe("2026-07-01");
  });
});

describe("isValidTimeZone", () => {
  test("accepts IANA zones and rejects anything else", () => {
    expect(isValidTimeZone("Europe/London")).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});

describe("oneYearBefore", () => {
  test("is the same month and day a year earlier", () => {
    expect(oneYearBefore("2026-11-04")).toBe("2025-11-04");
  });
});
