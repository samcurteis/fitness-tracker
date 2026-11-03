/** A calendar date as `YYYY-MM-DD`. */
export type IsoDate = string;

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function today(): IsoDate {
  return toIsoDate(new Date());
}

/** The date one year before `date` (same month and day). */
export function oneYearBefore(date: IsoDate): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return toIsoDate(d);
}
