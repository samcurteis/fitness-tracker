import type { CurrentValues } from "@/lib/training-load";
import { ZONE_COLOURS, ZoneBar } from "./zone-bar";

function fmt(value: number | undefined): string {
  return value === undefined ? "—" : String(Math.round(value));
}

/** Where the Athlete is today: zone name, Fitness/Fatigue/Form %, zone bar. */
export function Headline({ current }: { current: CurrentValues | undefined }) {
  const zone = current?.zone;
  return (
    <section aria-label="Today">
      <h2 style={zone ? { color: ZONE_COLOURS[zone] } : undefined}>
        {zone ?? "Not enough data"}
      </h2>
      <dl>
        <dt>Fitness</dt>
        <dd>{fmt(current?.fitness)}</dd>
        <dt>Fatigue</dt>
        <dd>{fmt(current?.fatigue)}</dd>
        <dt>Form %</dt>
        <dd>{current?.formPercent === undefined ? "—" : `${current.formPercent}%`}</dd>
      </dl>
      {current?.asOf && <p>as of {current.asOf}</p>}
      <ZoneBar current={zone} />
    </section>
  );
}
