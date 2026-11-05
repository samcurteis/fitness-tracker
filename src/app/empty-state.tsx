import { forgetKey } from "./key-actions";

export const INTERVALS_URL = "https://intervals.icu";

/** Shown when the key works but the 1Y wellness has no row with values. */
export function EmptyState() {
  return (
    <section>
      <p>No training data in intervals.icu yet</p>
      <p>
        <a href={INTERVALS_URL} target="_blank" rel="noreferrer">
          Open intervals.icu
        </a>
      </p>
      <form action={forgetKey}>
        <button type="submit">Forget key</button>
      </form>
    </section>
  );
}
