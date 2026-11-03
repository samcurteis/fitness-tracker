import { describe, expect, test } from "vitest";
import { form } from "./training-load";

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
