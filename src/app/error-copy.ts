import { IntervalsUnavailable, RateLimited } from "@/lib/get-wellness";

/** What the Athlete reads when loading their data failed. */
export function errorCopy(error: unknown): string {
  if (error instanceof RateLimited) {
    return error.minutes === undefined
      ? "Too many requests, try again later"
      : `Too many requests, try again in ${error.minutes} min`;
  }
  if (error instanceof IntervalsUnavailable) return "intervals.icu isn't responding";
  return "Something went wrong loading your data";
}

/** Key form error codes passed as `?error=` and their copy. */
const KEY_ERRORS: Record<string, string> = {
  "invalid-key": "intervals.icu rejected this key",
};

/** Copy for a `?error=` code on the key form; undefined for none or unknown. */
export function keyErrorCopy(code: string | string[] | undefined): string | undefined {
  return typeof code === "string" && Object.hasOwn(KEY_ERRORS, code)
    ? KEY_ERRORS[code]
    : undefined;
}
