/*
 * Typed failures from intervals.icu. Kept free of server-only code so the
 * client error boundary can import `parseErrorDigest`.
 *
 * In production Next strips a server error's message and class before it
 * reaches `error.tsx`, but keeps a `digest` the error already carries. So
 * RateLimited and IntervalsUnavailable set a stable digest that
 * `parseErrorDigest` reads back.
 */

const RATE_LIMITED_DIGEST = "intervals:rate-limited:";
const UNAVAILABLE_DIGEST = "intervals:unavailable";

/** intervals.icu rejected the API key (HTTP 401). */
export class InvalidKey extends Error {
  constructor() {
    super("intervals.icu rejected this key");
    this.name = "InvalidKey";
  }
}

/** intervals.icu rate-limited us (HTTP 429). */
export class RateLimited extends Error {
  readonly digest: string;
  constructor(readonly retryAfterMinutes: number) {
    super(`intervals.icu rate-limited this key; retry in ${retryAfterMinutes} min`);
    this.name = "RateLimited";
    this.digest = `${RATE_LIMITED_DIGEST}${retryAfterMinutes}`;
  }
}

/** intervals.icu failed: 5xx, network error or timeout. */
export class IntervalsUnavailable extends Error {
  readonly digest = UNAVAILABLE_DIGEST;
  constructor(cause?: unknown) {
    super("intervals.icu isn't responding", { cause });
    this.name = "IntervalsUnavailable";
  }
}

export type IntervalsFailure =
  | { kind: "rate-limited"; retryAfterMinutes: number }
  | { kind: "unavailable" };

/** Recover a typed intervals.icu failure from an error's `digest`, if it was one. */
export function parseErrorDigest(digest: string | undefined): IntervalsFailure | undefined {
  if (digest === UNAVAILABLE_DIGEST) return { kind: "unavailable" };
  if (digest?.startsWith(RATE_LIMITED_DIGEST)) {
    const minutes = Number(digest.slice(RATE_LIMITED_DIGEST.length));
    if (Number.isInteger(minutes) && minutes > 0) {
      return { kind: "rate-limited", retryAfterMinutes: minutes };
    }
  }
  return undefined;
}
