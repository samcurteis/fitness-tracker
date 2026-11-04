"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitKey, type KeyFormState } from "./key-actions";

export const SETTINGS_URL = "https://intervals.icu/settings";

export function KeyForm({ error }: { error?: string }) {
  const [state, action, pending] = useActionState<KeyFormState, FormData>(
    submitKey,
    { error },
  );
  // Filled after hydration; without JS the server falls back to UTC.
  const tzRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (tzRef.current) {
      tzRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }, []);

  return (
    <form action={action}>
      <input ref={tzRef} type="hidden" name="tz" defaultValue="" />
      <label htmlFor="key">intervals.icu API key</label>
      <input
        id="key"
        name="key"
        type="password"
        autoComplete="off"
        required
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "key-error" : undefined}
      />
      <p>
        Find it in{" "}
        <a href={SETTINGS_URL} target="_blank" rel="noreferrer">
          intervals.icu settings
        </a>{" "}
        (Developer Settings). The key is stored only in this browser.
      </p>
      {state.error && (
        <p id="key-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Save key"}
      </button>
    </form>
  );
}
