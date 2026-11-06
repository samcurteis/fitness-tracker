import { ZONE_COLOURS, ZONES, type Zone } from "@/lib/training-load";

export { ZONE_COLOURS };

/** The five zones left → right, with a marker in `current` (none when undefined). */
export function ZoneBar({ current }: { current: Zone | undefined }) {
  return (
    <ul
      aria-label="Form % zones"
      style={{ display: "flex", listStyle: "none", padding: 0, margin: 0, gap: 2 }}
    >
      {ZONES.map((zone) => {
        const isCurrent = zone === current;
        return (
          <li
            key={zone}
            aria-current={isCurrent ? "true" : undefined}
            style={{ flex: 1, textAlign: "center", fontSize: 12 }}
          >
            <div style={{ height: 8, background: ZONE_COLOURS[zone] }} />
            <div style={{ height: 12 }}>
              {isCurrent && (
                <span data-testid="zone-marker" aria-label="current zone">
                  ▲
                </span>
              )}
            </div>
            {zone}
          </li>
        );
      })}
    </ul>
  );
}
