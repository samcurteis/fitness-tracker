"use server";

import { cookies } from "next/headers";
import { today } from "@/lib/dates";
import { getWellness, InvalidKey } from "@/lib/get-wellness";
import { KEY_COOKIE, KEY_COOKIE_MAX_AGE } from "@/lib/key-cookie";

export type KeyFormState = { error?: string };

/** Validate the key with one wellness call, then store it in the key cookie. */
export async function submitKey(
  _prev: KeyFormState,
  formData: FormData,
): Promise<KeyFormState> {
  const key = String(formData.get("key") ?? "").trim();
  if (!key) return { error: "Enter your intervals.icu API key" };

  const date = today();
  try {
    await getWellness(key, { oldest: date, newest: date });
  } catch (e) {
    if (e instanceof InvalidKey) return { error: "intervals.icu rejected this key" };
    throw e;
  }

  (await cookies()).set(KEY_COOKIE, key, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: KEY_COOKIE_MAX_AGE,
  });
  return {};
}

/** Delete the key cookie, returning the Athlete to the key form. */
export async function forgetKey(): Promise<void> {
  (await cookies()).delete(KEY_COOKIE);
}
