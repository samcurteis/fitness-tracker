// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { IntervalsUnavailable, RateLimited } from "@/lib/intervals-errors";
import ErrorPage from "./error";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

/** What reaches the boundary in production: a plain Error with only the digest kept. */
function stripped(error: { digest: string }): Error {
  return Object.assign(new Error("An error occurred in the Server Components render."), {
    digest: error.digest,
  });
}

describe("error boundary", () => {
  test("RateLimited shows 'Too many requests, try again in N min'", () => {
    render(<ErrorPage error={stripped(new RateLimited(2))} reset={vi.fn()} />);
    expect(screen.getByText("Too many requests, try again in 2 min")).toBeTruthy();
  });

  test("IntervalsUnavailable shows 'intervals.icu isn't responding'", () => {
    render(<ErrorPage error={stripped(new IntervalsUnavailable())} reset={vi.fn()} />);
    expect(screen.getByText("intervals.icu isn't responding")).toBeTruthy();
  });

  test("anything else shows generic copy", () => {
    render(<ErrorPage error={stripped({ digest: "123456789" })} reset={vi.fn()} />);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.queryByText(/intervals.icu|Too many/)).toBeNull();
  });

  test("a non-Error value shows generic copy", () => {
    render(<ErrorPage error="boom" reset={vi.fn()} />);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  test("'Try again' calls reset() and router.refresh()", () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error("x")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
