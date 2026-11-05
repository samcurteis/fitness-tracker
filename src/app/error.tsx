"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { parseErrorDigest } from "@/lib/intervals-errors";

/** Copy for an error that reached the boundary, read from its stable `digest`. */
function errorCopy(error: unknown): string {
  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined;
  const failure = parseErrorDigest(digest);
  switch (failure?.kind) {
    case "rate-limited":
      return `Too many requests, try again in ${failure.retryAfterMinutes} min`;
    case "unavailable":
      return "intervals.icu isn't responding";
    default:
      return "Something went wrong";
  }
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <div role="alert">
      <p>{errorCopy(error)}</p>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            reset();
            router.refresh();
          })
        }
      >
        Try again
      </button>
    </div>
  );
}
