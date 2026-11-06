import { forgetKey } from "./key-actions";

export const INTERVALS_URL = "https://intervals.icu";

/** The key works but the 1Y range has no Fitness/Fatigue values yet. */
export function EmptyState() {
  return (
    <section>
      <p>No training data in intervals.icu yet</p>
      <p>
        Record or sync some activities on{" "}
        <a href={INTERVALS_URL} target="_blank" rel="noreferrer">
          intervals.icu
        </a>
        , then come back.
      </p>
      <form action={forgetKey}>
        <button type="submit">Forget key</button>
      </form>
    </section>
  );
}
