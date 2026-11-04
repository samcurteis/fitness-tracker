"use server";

import { cookies } from "next/headers";
import { isValidTimeZone, today } from "@/lib/dates";
import { getWellness, InvalidKey } from "@/lib/get-wellness";
import { KEY_COOKIE, KEY_COOKIE_MAX_AGE, TZ_COOKIE } from "@/lib/key-cookie";

export type KeyFormState = { error?: string };

const cookieOptions = {
  secure: true,
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: KEY_COOKIE_MAX_AGE,
} as const;

/**
 * Validate the key with one wellness call, then store it in the key cookie.
 * The browser's time zone (`tz`) is stored alongside so "today" is the Athlete's date.
 */
export async function submitKey(
  _prev: KeyFormState,
  formData: FormData,
): Promise<KeyFormState> {
  const key = String(formData.get("key") ?? "").trim();
  if (!key) return { error: "Enter your intervals.icu API key" };
  const tz = String(formData.get("tz") ?? "");
  const timeZone = isValidTimeZone(tz) ? tz : undefined;

  const date = today(timeZone);
  try {
    await getWellness(key, { oldest: date, newest: date });
  } catch (e) {
    if (e instanceof InvalidKey) return { error: "intervals.icu rejected this key" };
    throw e;
  }

  const store = await cookies();
  store.set(KEY_COOKIE, key, cookieOptions);
  if (timeZone) store.set(TZ_COOKIE, timeZone, cookieOptions);
  return {};
}

/** Delete the key cookie, returning the Athlete to the key form. */
export async function forgetKey(): Promise<void> {
  const store = await cookies();
  store.delete(KEY_COOKIE);
  store.delete(TZ_COOKIE);
}
