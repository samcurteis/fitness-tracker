"use client";

import { useRouter } from "next/navigation";

/** An error message with "Try again", which resets the boundary (if any) and re-fetches. */
export function ErrorView({ message, reset }: { message: string; reset?: () => void }) {
  const router = useRouter();
  return (
    <section role="alert">
      <p>{message}</p>
      <button
        type="button"
        onClick={() => {
          reset?.();
          router.refresh();
        }}
      >
        Try again
      </button>
    </section>
  );
}
