/** A calendar date as `YYYY-MM-DD`. */
export type IsoDate = string;

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/** True when `tz` is an IANA time zone this runtime knows, e.g. `Europe/London`. */
export function isValidTimeZone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Today's date in `timeZone` (the Athlete's), falling back to UTC. */
export function today(timeZone?: string): IsoDate {
  const tz = timeZone && isValidTimeZone(timeZone) ? timeZone : "UTC";
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** The date one year before `date` (same month and day). */
export function oneYearBefore(date: IsoDate): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return toIsoDate(d);
}
