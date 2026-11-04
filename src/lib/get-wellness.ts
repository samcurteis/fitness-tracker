import type { IsoDate } from "./dates";

/** One day of intervals.icu wellness. Values can be null for a day with no data. */
export type WellnessRow = {
  date: IsoDate;
  fitness: number | null;
  fatigue: number | null;
};

export type DateRange = { oldest: IsoDate; newest: IsoDate };

/** intervals.icu rejected the API key (HTTP 401). */
export class InvalidKey extends Error {
  constructor() {
    super("intervals.icu rejected this key");
    this.name = "InvalidKey";
  }
}

type ApiWellness = { id: string; ctl?: number | null; atl?: number | null };

function baseUrl(): string {
  return process.env.INTERVALS_BASE_URL ?? "https://intervals.icu";
}

/** Fetch daily Fitness (`ctl`) and Fatigue (`atl`) for `range`, newest inclusive. */
export async function getWellness(
  key: string,
  range: DateRange,
): Promise<WellnessRow[]> {
  const url = new URL("/api/v1/athlete/0/wellness", baseUrl());
  url.searchParams.set("oldest", range.oldest);
  url.searchParams.set("newest", range.newest);
  url.searchParams.set("fields", "id,ctl,atl");

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`API_KEY:${key}`).toString("base64")}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 401) throw new InvalidKey();
  if (!res.ok) throw new Error(`intervals.icu responded ${res.status}`);

  const body = (await res.json()) as ApiWellness[];
  return body.map((w) => ({
    date: w.id,
    fitness: w.ctl ?? null,
    fatigue: w.atl ?? null,
  }));
}
