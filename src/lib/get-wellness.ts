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

/** intervals.icu is rate limiting us (HTTP 429). */
export class RateLimited extends Error {
  /** Whole minutes until a retry should succeed; undefined when unknown. */
  readonly minutes: number | undefined;
  constructor(minutes: number | undefined) {
    super("intervals.icu rate limited this request");
    this.name = "RateLimited";
    this.minutes = minutes;
  }
}

/** intervals.icu failed, timed out or could not be reached. */
export class IntervalsUnavailable extends Error {
  constructor(cause?: unknown) {
    super("intervals.icu isn't responding", { cause });
    this.name = "IntervalsUnavailable";
  }
}

/**
 * Minutes until retry from a `Retry-After` header (delta-seconds or HTTP-date),
 * rounded up, minimum 1. Undefined when missing or unparseable.
 */
export function retryAfterMinutes(
  header: string | null,
  now: Date = new Date(),
): number | undefined {
  if (!header) return undefined;
  const value = header.trim();
  let ms: number;
  if (/^\d+$/.test(value)) {
    ms = Number(value) * 1000;
  } else {
    const at = Date.parse(value);
    if (Number.isNaN(at)) return undefined;
    ms = at - now.getTime();
  }
  return Math.max(1, Math.ceil(ms / 60_000));
}

type ApiWellness = { id: string; ctl?: number | null; atl?: number | null };

function baseUrl(): string {
  return process.env.INTERVALS_BASE_URL ?? "https://intervals.icu";
}

export const TIMEOUT_MS = 10_000;

/** Fetch daily Fitness (`ctl`) and Fatigue (`atl`) for `range`, newest inclusive. */
export async function getWellness(
  key: string,
  range: DateRange,
  { timeoutMs = TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<WellnessRow[]> {
  const url = new URL("/api/v1/athlete/0/wellness", baseUrl());
  url.searchParams.set("oldest", range.oldest);
  url.searchParams.set("newest", range.newest);
  url.searchParams.set("fields", "id,ctl,atl");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`API_KEY:${key}`).toString("base64")}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    // Network failure or timeout.
    throw new IntervalsUnavailable(e);
  }

  if (res.status === 401) throw new InvalidKey();
  if (res.status === 429) {
    throw new RateLimited(retryAfterMinutes(res.headers.get("retry-after")));
  }
  if (res.status >= 500) throw new IntervalsUnavailable(res.status);
  if (!res.ok) throw new Error(`intervals.icu responded ${res.status}`);

  let body: ApiWellness[];
  try {
    body = (await res.json()) as ApiWellness[];
  } catch (e) {
    // Body cut off, timed out mid-read, or not JSON.
    throw new IntervalsUnavailable(e);
  }
  return body.map((w) => ({
    date: w.id,
    fitness: w.ctl ?? null,
    fatigue: w.atl ?? null,
  }));
}
