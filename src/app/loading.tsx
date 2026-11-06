/** Shown while the page (and its intervals.icu call) loads. */
export default function Loading() {
  return (
    <p role="status" aria-live="polite">
      Loading…
    </p>
  );
}
