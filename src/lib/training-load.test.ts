import { describe, expect, test } from "vitest";
import { addDays } from "./dates";
import type { WellnessRow } from "./get-wellness";
import {
  currentValues,
  displayedFormPercent,
  form,
  formSegmentColour,
  RANGES,
  rangeStart,
  sliceRange,
  toChartData,
  ZONE_COLOURS,
  zoneOf,
} from "./training-load";

/** One row per day from `oldest` to `newest`, all with the same load. */
function daily(oldest: string, newest: string, load = { fitness: 50, fatigue: 40 }) {
  const rows: WellnessRow[] = [];
  for (let d = oldest; d <= newest; d = addDays(d, 1)) rows.push({ date: d, ...load });
  return rows;
}

describe("range slicing", () => {
  const today = "2026-11-06";
  const rows = daily("2025-11-01", today);

  test.each([
    ["42D", "2026-09-26"],
    ["14D", "2026-10-24"],
    ["3M", "2026-08-06"],
    ["6M", "2026-05-06"],
    ["1Y", "2025-11-06"],
    ["YTD", "2026-01-01"],
  ] as const)("%s starts %s and ends today", (range, start) => {
    expect(rangeStart(range, today)).toBe(start);
    const sliced = sliceRange(rows, range, today);
    expect(sliced[0].date).toBe(start);
    expect(sliced.at(-1)?.date).toBe(today);
  });

  test("nD has n days including today", () => {
    expect(sliceRange(rows, "42D", today)).toHaveLength(42);
    expect(sliceRange(rows, "14D", today)).toHaveLength(14);
  });

  test("covers all six ranges", () => {
    expect(RANGES).toEqual(["YTD", "1Y", "6M", "3M", "42D", "14D"]);
  });

  test("month ranges clamp to the end of a shorter month", () => {
    expect(rangeStart("3M", "2026-05-31")).toBe("2026-02-28");
  });

  test("a range longer than the data returns what exists, from the earliest row with values", () => {
    const short = [
      { date: "2026-10-01", fitness: null, fatigue: null },
      { date: "2026-10-02", fitness: 10, fatigue: null },
      ...daily("2026-10-03", today),
    ];
    for (const range of ["YTD", "1Y", "6M", "3M", "42D"] as const) {
      const sliced = sliceRange(short, range, today);
      expect(sliced[0].date).toBe("2026-10-03");
      expect(sliced.at(-1)?.date).toBe(today);
    }
  });

  test("ignores rows after today", () => {
    const sliced = sliceRange(daily("2026-11-01", "2026-11-10"), "14D", today);
    expect(sliced.at(-1)?.date).toBe(today);
  });
});

describe("toChartData", () => {
  const today = "2026-11-06";

  test("labels are every date from the range start to today", () => {
    const data = toChartData(daily("2026-01-01", today), "14D", today);
    expect(data.labels).toHaveLength(14);
    expect(data.labels[0]).toBe("2026-10-24");
    data.labels.forEach((d, i) => {
      if (i > 0) expect(d).toBe(addDays(data.labels[i - 1], 1));
    });
    expect(data.labels.at(-1)).toBe(today);
  });

  test("a missing interior date becomes a null point; neighbours unchanged", () => {
    const rows = daily("2026-10-24", today).filter((r) => r.date !== "2026-11-01");
    rows[0] = { ...rows[0], fitness: 30, fatigue: 20 };
    const data = toChartData(rows, "14D", today);
    const i = data.labels.indexOf("2026-11-01");
    expect(i).toBeGreaterThan(0);
    expect(data.fitness[i]).toBeNull();
    expect(data.fatigue[i]).toBeNull();
    expect(data.formPercent[i]).toBeNull();
    expect(data.fitness[i - 1]).toBe(50);
    expect(data.fitness[i + 1]).toBe(50);
    expect(data.fitness[0]).toBe(30);
    expect(data.formPercent[i + 1]).toBe(20);
  });

  test("a row with null Fitness or Fatigue becomes a null point", () => {
    const rows = daily("2026-10-24", today).map((r) =>
      r.date === "2026-10-30"
        ? { ...r, fitness: null }
        : r.date === "2026-10-31"
          ? { ...r, fatigue: null }
          : r,
    );
    const data = toChartData(rows, "14D", today);
    for (const d of ["2026-10-30", "2026-10-31"]) {
      const i = data.labels.indexOf(d);
      expect(data.fitness[i]).toBeNull();
      expect(data.fatigue[i]).toBeNull();
      expect(data.formPercent[i]).toBeNull();
    }
    const next = data.labels.indexOf("2026-11-01");
    expect(data.fitness[next]).toBe(50);
    expect(data.fatigue[next]).toBe(40);
  });

  test("Form % is unrounded and null when Fitness is 0", () => {
    const rows = [
      { date: "2026-11-05", fitness: 100, fatigue: 109.6 },
      { date: today, fitness: 0, fatigue: 5 },
    ];
    const data = toChartData(rows, "14D", today);
    expect(data.labels).toEqual(["2026-11-05", today]);
    expect(data.formPercent[0]).toBeCloseTo(-9.6);
    expect(data.formPercent[1]).toBeNull();
    expect(data.fitness[1]).toBe(0);
  });

  test("no rows with values → empty", () => {
    expect(toChartData([], "42D", today).labels).toEqual([]);
  });

  function expectFullLengthWithNullStart(rows: WellnessRow[]) {
    const start = rangeStart("42D", today);
    const data = toChartData(rows, "42D", today);
    expect(data.labels).toHaveLength(42);
    expect(data.labels[0]).toBe(start);
    expect(data.labels.at(-1)).toBe(today);
    expect(data.fitness[0]).toBeNull();
    expect(data.fatigue[0]).toBeNull();
    expect(data.formPercent[0]).toBeNull();
    expect(data.fitness[1]).toBe(50);
  }

  test("data before range start: null range-start row kept as null point", () => {
    const start = rangeStart("42D", today);
    const rows = daily(addDays(today, -59), today).map((r) =>
      r.date === start ? { ...r, fitness: null, fatigue: null } : r,
    );
    expectFullLengthWithNullStart(rows);
  });

  test("data before range start: missing range-start row kept as null point", () => {
    const start = rangeStart("42D", today);
    const rows = daily(addDays(today, -59), today).filter((r) => r.date !== start);
    expectFullLengthWithNullStart(rows);
  });

  test("range longer than data starts at earliest row with values", () => {
    const rows = daily(addDays(today, -9), today).map((r, i) =>
      i < 2 ? { ...r, fitness: null, fatigue: null } : r,
    );
    const data = toChartData(rows, "42D", today);
    expect(data.labels).toHaveLength(8);
    expect(data.labels[0]).toBe(addDays(today, -7));
    expect(data.fitness[0]).toBe(50);
  });

  test("rows before range start without values don't count as data", () => {
    const rows = [
      ...daily(addDays(today, -59), addDays(today, -10)).map((r) => ({
        ...r,
        fitness: null,
        fatigue: null,
      })),
      ...daily(addDays(today, -9), today),
    ];
    const data = toChartData(rows, "42D", today);
    expect(data.labels).toHaveLength(10);
    expect(data.labels[0]).toBe(addDays(today, -9));
  });

  test("data before range start but none in range → full-length null points", () => {
    const rows = daily(addDays(today, -59), addDays(today, -42));
    const data = toChartData(rows, "42D", today);
    expect(data.labels).toHaveLength(42);
    expect(data.fitness.every((v) => v === null)).toBe(true);
  });
});

describe("formSegmentColour", () => {
  test.each([
    [20, "Transition"],
    [19.99, "Fresh"],
    [5, "Fresh"],
    [4.99, "Grey zone"],
    [-9.99, "Grey zone"],
    [-9.6, "Grey zone"],
    [-10, "Optimal"],
    [-29.99, "Optimal"],
    [-30, "High risk"],
  ] as const)("ending at %d → %s colour", (p1, zone) => {
    expect(formSegmentColour(0, p1)).toBe(ZONE_COLOURS[zone]);
  });

  test("uses the end point (p1), not the start", () => {
    expect(formSegmentColour(25, -15)).toBe(ZONE_COLOURS.Optimal);
  });

  test("is null when either end is missing", () => {
    expect(formSegmentColour(null, 10)).toBeNull();
    expect(formSegmentColour(10, null)).toBeNull();
    expect(formSegmentColour(undefined, 10)).toBeNull();
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
