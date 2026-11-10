import type { IsoDate } from "@/lib/dates";

export type ReadoutDay = {
  date: IsoDate;
  fitness: number | null;
  fatigue: number | null;
  /** Displayed (rounded) Form %. */
  formPercent: number | null;
};

function fmt(value: number | null): string {
  return value === null ? "—" : String(Math.round(value));
}

/** One day's date, Fitness, Fatigue and Form %: the hovered day, or the current day when idle. */
export function HoverReadout({ day }: { day: ReadoutDay }) {
  return (
    <section aria-label="Readout">
      <p>{day.date}</p>
      <dl>
        <dt>Fitness</dt>
        <dd>{fmt(day.fitness)}</dd>
        <dt>Fatigue</dt>
        <dd>{fmt(day.fatigue)}</dd>
        <dt>Form %</dt>
        <dd>{day.formPercent === null ? "—" : `${day.formPercent}%`}</dd>
      </dl>
    </section>
  );
}
