import type { WellnessRow } from "./get-wellness";

/** Form = Fitness − Fatigue for the same day; null when either is missing. */
export function form(row: Pick<WellnessRow, "fitness" | "fatigue">): number | null {
  if (row.fitness === null || row.fatigue === null) return null;
  return row.fitness - row.fatigue;
}
