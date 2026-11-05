import type { IsoDate } from "./dates";
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
