import { addDays, monthsBefore, oneYearBefore, type IsoDate } from "./dates";
import type { WellnessRow } from "./get-wellness";

type Load = Pick<WellnessRow, "fitness" | "fatigue">;

/** Form = Fitness − Fatigue for the same day; null when either is missing. */
export function form(row: Load): number | null {
  if (row.fitness === null || row.fatigue === null) return null;
  return row.fitness - row.fatigue;
}

/**
 * Form % as displayed: round Fitness and Fatigue, divide by the unrounded
 * Fitness, round the result. Undefined when Fitness is 0 or a value is missing.
 */
export function displayedFormPercent(row: Load): number | undefined {
  const { fitness, fatigue } = row;
  if (fitness === null || fatigue === null || fitness === 0) return undefined;
  const pct = Math.round(
    ((Math.round(fitness) - Math.round(fatigue)) * 100) / fitness,
  );
  return pct === 0 ? 0 : pct; // avoid -0
}

export const ZONES = [
  "Transition",
  "Fresh",
  "Grey zone",
  "Optimal",
  "High risk",
] as const;

export type Zone = (typeof ZONES)[number];

/** The zone for a Form % (edges inclusive, per spec). */
export function zoneOf(formPercent: number): Zone {
  if (formPercent >= 20) return "Transition";
  if (formPercent >= 5) return "Fresh";
  if (formPercent > -10) return "Grey zone";
  if (formPercent > -30) return "Optimal";
  return "High risk";
}

/** Zone colours from the chart-design prototype (variant D). */
export const ZONE_COLOURS: Record<Zone, string> = {
  Transition: "#facc15",
  Fresh: "#3b82f6",
  "Grey zone": "#94a3b8",
  Optimal: "#22c55e",
  "High risk": "#ef4444",
};

export const RANGES = ["YTD", "1Y", "6M", "3M", "42D", "14D"] as const;

export type Range = (typeof RANGES)[number];

export const DEFAULT_RANGE: Range = "42D";

/** First date of `range` ending `today` (inclusive). nD is n days including today. */
export function rangeStart(range: Range, today: IsoDate): IsoDate {
  switch (range) {
    case "YTD":
      return `${today.slice(0, 4)}-01-01`;
    case "1Y":
      return oneYearBefore(today);
    case "6M":
      return monthsBefore(today, 6);
    case "3M":
      return monthsBefore(today, 3);
    case "42D":
      return addDays(today, -41);
    case "14D":
      return addDays(today, -13);
  }
}

function hasLoad(row: Load): boolean {
  return row.fitness !== null && row.fatigue !== null;
}

/**
 * The rows in `range` ending `today`, by date. When the data starts later than
 * the range, starts at the earliest row with Fitness and Fatigue.
 */
export function sliceRange(
  rows: readonly WellnessRow[],
  range: Range,
  today: IsoDate,
): WellnessRow[] {
  const start = rangeStart(range, today);
  const inRange = rows
    .filter((r) => r.date >= start && r.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const first = inRange.findIndex(hasLoad);
  return first === -1 ? [] : inRange.slice(first);
}

export type ChartData = {
  labels: IsoDate[];
  fitness: (number | null)[];
  fatigue: (number | null)[];
  /** Unrounded Form %; null when a value is missing or Fitness is 0. */
  formPercent: (number | null)[];
};

/** Unrounded Form % for the chart line; null when a value is missing or Fitness is 0. */
export function formPercent(row: Load): number | null {
  const f = form(row);
  if (f === null || row.fitness === 0) return null;
  return (f * 100) / row.fitness!;
}

/**
 * One point per date from the start of the sliced range to `today`. Dates with
 * no row, or a row without values, are null points. No interpolation.
 */
export function toChartData(
  rows: readonly WellnessRow[],
  range: Range,
  today: IsoDate,
): ChartData {
  const sliced = sliceRange(rows, range, today);
  const data: ChartData = { labels: [], fitness: [], fatigue: [], formPercent: [] };
  if (sliced.length === 0) return data;
  const byDate = new Map(sliced.map((r) => [r.date, r]));
  for (let d = sliced[0].date; d <= today; d = addDays(d, 1)) {
    const row = byDate.get(d);
    const ok = row !== undefined && hasLoad(row);
    data.labels.push(d);
    data.fitness.push(ok ? row.fitness : null);
    data.fatigue.push(ok ? row.fatigue : null);
    data.formPercent.push(ok ? formPercent(row) : null);
  }
  return data;
}

/**
 * Colour of the Form % segment from `p0` to `p1`: the zone of `p1`, the day the
 * line arrives at (unrounded). Null when either end is missing.
 */
export function formSegmentColour(
  p0: number | null | undefined,
  p1: number | null | undefined,
): string | null {
  if (p0 == null || p1 == null || Number.isNaN(p0) || Number.isNaN(p1)) {
    return null;
  }
  return ZONE_COLOURS[zoneOf(p1)];
}

export type CurrentValues = {
  fitness: number;
  fatigue: number;
  /** Displayed (rounded) Form %; undefined when Fitness is 0. */
  formPercent: number | undefined;
  /** The headline zone, from the displayed Form %. */
  zone: Zone | undefined;
  /** Set only when the values are not today's. */
  asOf?: IsoDate;
};

/**
 * Whether any row has both Fitness and Fatigue. Only null counts as missing,
 * so all-zero data is still training data (the headline shows "Not enough data").
 */
export function hasTrainingData(rows: readonly WellnessRow[]): boolean {
  return rows.some((r) => r.fitness !== null && r.fatigue !== null);
}

/**
 * Today's values, or the latest earlier day with values ("as of" that date).
 * Undefined when no day has values.
 */
export function currentValues(
  rows: readonly WellnessRow[],
  today: IsoDate,
): CurrentValues | undefined {
  const row = rows
    .filter((r) => r.date <= today && r.fitness !== null && r.fatigue !== null)
    .reduce<WellnessRow | undefined>(
      (latest, r) => (!latest || r.date > latest.date ? r : latest),
      undefined,
    );
  if (!row || row.fitness === null || row.fatigue === null) return undefined;
  const formPercent = displayedFormPercent(row);
  return {
    fitness: row.fitness,
    fatigue: row.fatigue,
    formPercent,
    zone: formPercent === undefined ? undefined : zoneOf(formPercent),
    ...(row.date === today ? {} : { asOf: row.date }),
  };
}
