import type { IsoDate } from "./dates";
import { IntervalsUnavailable, InvalidKey, RateLimited } from "./intervals-errors";

/** One day of intervals.icu wellness. Values can be null for a day with no data. */
export type WellnessRow = {
  date: IsoDate;
  fitness: number | null;
  fatigue: number | null;
};

export type DateRange = { oldest: IsoDate; newest: IsoDate };

export {
  IntervalsUnavailable,
  InvalidKey,
  parseErrorDigest,
  RateLimited,
  type IntervalsFailure,
} from "./intervals-errors";

/** Whole minutes (at least 1) from a `Retry-After` header: seconds or an HTTP date. */
function retryAfterMinutes(header: string | null, now = Date.now()): number {
  let seconds = Number(header);
  if (header === null || header.trim() === "" || !Number.isFinite(seconds)) {
    const at = header === null ? NaN : Date.parse(header);
    seconds = Number.isNaN(at) ? 60 : (at - now) / 1000;
  }
  return Math.max(1, Math.ceil(seconds / 60));
}

type ApiWellness = { id: string; ctl?: number | null; atl?: number | null };

function baseUrl(): string {
  return process.env.INTERVALS_BASE_URL ?? "https://intervals.icu";
}

/** How long to wait for intervals.icu before giving up. */
export const FETCH_TIMEOUT_MS = 10_000;

/** Fetch daily Fitness (`ctl`) and Fatigue (`atl`) for `range`, newest inclusive. */
export async function getWellness(
  key: string,
  range: DateRange,
): Promise<WellnessRow[]> {
  const url = new URL("/api/v1/athlete/0/wellness", baseUrl());
  url.searchParams.set("oldest", range.oldest);
  url.searchParams.set("newest", range.newest);
  url.searchParams.set("fields", "id,ctl,atl");

  let body: ApiWellness[];
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`API_KEY:${key}`).toString("base64")}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status === 401) throw new InvalidKey();
    if (res.status === 429) {
      throw new RateLimited(retryAfterMinutes(res.headers.get("retry-after")));
    }
    if (res.status >= 500) throw new IntervalsUnavailable(`HTTP ${res.status}`);
    if (!res.ok) throw new Error(`intervals.icu responded ${res.status}`);
    body = (await res.json()) as ApiWellness[];
  } catch (e) {
    // fetch rejects with a TypeError on network failure and a
    // TimeoutError/AbortError when the signal fires (also mid-body).
    if (
      e instanceof TypeError ||
      (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError"))
    ) {
      throw new IntervalsUnavailable(e);
    }
    throw e;
  }

  return body.map((w) => ({
    date: w.id,
    fitness: w.ctl ?? null,
    fatigue: w.atl ?? null,
  }));
}
