import { describe, expect, test } from "vitest";
import { form, hasTrainingData } from "./training-load";

describe("hasTrainingData", () => {
  test("is false for no rows or only rows without values", () => {
    expect(hasTrainingData([])).toBe(false);
    expect(
      hasTrainingData([
        { date: "2026-10-01", fitness: null, fatigue: null },
        { date: "2026-10-02", fitness: null, fatigue: null },
      ]),
    ).toBe(false);
  });

  test("is true when any row has Fitness or Fatigue", () => {
    expect(
      hasTrainingData([
        { date: "2026-10-01", fitness: null, fatigue: null },
        { date: "2026-10-02", fitness: 0, fatigue: null },
      ]),
    ).toBe(true);
    expect(hasTrainingData([{ date: "2026-10-01", fitness: null, fatigue: 3 }])).toBe(true);
  });
});

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
