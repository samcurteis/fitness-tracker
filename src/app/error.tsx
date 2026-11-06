"use client";

import { errorCopy } from "./error-copy";
import { ErrorView } from "./error-view";

/**
 * Fallback for errors the page didn't handle. In production Next strips server
 * errors to a generic Error, so typed intervals.icu errors are caught in the page
 * and this usually shows the generic copy.
 */
export default function Error({ error, reset }: { error: unknown; reset: () => void }) {
  return <ErrorView message={errorCopy(error)} reset={reset} />;
}
