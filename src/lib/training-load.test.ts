import { describe, expect, test } from "vitest";
import {
  currentValues,
  displayedFormPercent,
  form,
  zoneOf,
} from "./training-load";

describe("form", () => {
  test("is Fitness minus Fatigue for the same day", () => {
    expect(form({ fitness: 48, fatigue: 55 })).toBe(-7);
    expect(form({ fitness: 50.5, fatigue: 40.25 })).toBeCloseTo(10.25);
  });

  test("is null when Fitness or Fatigue is missing", () => {
    expect(form({ fitness: null, fatigue: 10 })).toBeNull();
    expect(form({ fitness: 10, fatigue: null })).toBeNull();
  });
});

describe("displayedFormPercent", () => {
  test("rounds Fitness and Fatigue first, divides by unrounded Fitness, rounds", () => {
    // (50 − 41) × 100 / 50.4 = 17.86 → 18; unrounded would be 19.44 → 19.
    expect(displayedFormPercent({ fitness: 50.4, fatigue: 40.6 })).toBe(18);
  });

  test("is undefined when Fitness is 0", () => {
    expect(displayedFormPercent({ fitness: 0, fatigue: 5 })).toBeUndefined();
  });

  test("is undefined when a value is missing", () => {
    expect(displayedFormPercent({ fitness: null, fatigue: 5 })).toBeUndefined();
    expect(displayedFormPercent({ fitness: 5, fatigue: null })).toBeUndefined();
  });
});

describe("zoneOf", () => {
  test.each([
    [20, "Transition"],
    [19.99, "Fresh"],
    [5, "Fresh"],
    [4.99, "Grey zone"],
    [-9.99, "Grey zone"],
    [-10, "Optimal"],
    [-29.99, "Optimal"],
    [-30, "High risk"],
  ] as const)("%d → %s", (pct, zone) => {
    expect(zoneOf(pct)).toBe(zone);
  });
});

describe("currentValues", () => {
  const today = "2026-11-05";

  test("headline zone uses the displayed Form %", () => {
    // Unrounded −9.6 would be Grey zone; displayed (100 − 110) = −10 → Optimal.
    const current = currentValues(
      [{ date: today, fitness: 100, fatigue: 109.6 }],
      today,
    );
    expect(current?.formPercent).toBe(-10);
    expect(current?.zone).toBe("Optimal");
  });

  test("uses today's row when it has values, with no as of", () => {
    const current = currentValues(
      [
        { date: "2026-11-04", fitness: 40, fatigue: 30 },
        { date: today, fitness: 50, fatigue: 40 },
      ],
      today,
    );
    expect(current).toEqual({
      fitness: 50,
      fatigue: 40,
      formPercent: 20,
      zone: "Transition",
    });
    expect(current).not.toHaveProperty("asOf");
  });

  test("falls back to the latest day with values, with as of", () => {
    const current = currentValues(
      [
        { date: "2026-11-02", fitness: 40, fatigue: 30 },
        { date: "2026-11-03", fitness: 45, fatigue: 50 },
        { date: "2026-11-04", fitness: null, fatigue: null },
        { date: today, fitness: null, fatigue: 12 },
      ],
      today,
    );
    expect(current).toMatchObject({
      fitness: 45,
      fatigue: 50,
      asOf: "2026-11-03",
    });
  });

  test("is undefined when no day has values", () => {
    expect(currentValues([], today)).toBeUndefined();
    expect(
      currentValues([{ date: today, fitness: null, fatigue: null }], today),
    ).toBeUndefined();
  });

  test("Fitness 0 → no Form % and no zone", () => {
    const current = currentValues(
      [{ date: today, fitness: 0, fatigue: 0 }],
      today,
    );
    expect(current?.formPercent).toBeUndefined();
    expect(current?.zone).toBeUndefined();
  });
});
