"use client";

import type { WellnessRow } from "@/lib/get-wellness";
import { form } from "@/lib/training-load";

function fmt(value: number | null): string {
  return value === null ? "—" : String(Math.round(value));
}

/** Placeholder: today's Fitness, Fatigue and Form as plain text (replaced by #13). */
export function TodayLoad({ rows }: { rows: WellnessRow[] }) {
  const latest = rows.at(-1);
  if (!latest) return <p>No data for today.</p>;
  return (
    <dl>
      <dt>Fitness</dt>
      <dd>{fmt(latest.fitness)}</dd>
      <dt>Fatigue</dt>
      <dd>{fmt(latest.fatigue)}</dd>
      <dt>Form</dt>
      <dd>{fmt(form(latest))}</dd>
    </dl>
  );
}
