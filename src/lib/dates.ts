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

/** `date` moved by `days` (negative for earlier). */
export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

/**
 * The same day `months` calendar months before `date`, clamped to the end of
 * the month when that day doesn't exist (e.g. 3 months before 31 May is 28/29 Feb).
 */
export function monthsBefore(date: IsoDate, months: number): IsoDate {
  const [y, m, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 - months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return toIsoDate(target);
}

/** The date one year before `date` (same month and day). */
export function oneYearBefore(date: IsoDate): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return toIsoDate(d);
}
