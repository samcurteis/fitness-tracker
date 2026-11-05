import type { WellnessRow } from "./get-wellness";

/** True when at least one row has a Fitness or Fatigue value. */
export function hasTrainingData(rows: readonly WellnessRow[]): boolean {
  return rows.some((r) => r.fitness !== null || r.fatigue !== null);
}

/** Form = Fitness − Fatigue for the same day; null when either is missing. */
export function form(row: Pick<WellnessRow, "fitness" | "fatigue">): number | null {
  if (row.fitness === null || row.fatigue === null) return null;
  return row.fitness - row.fatigue;
}
