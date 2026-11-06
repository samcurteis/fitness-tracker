// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { IntervalsUnavailable, RateLimited } from "@/lib/get-wellness";
import ErrorPage from "./error";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function message(): string | null {
  return screen.getByRole("alert").querySelector("p")!.textContent;
}

describe("error UI", () => {
  test("RateLimited shows the minutes to wait", () => {
    render(<ErrorPage error={new RateLimited(2)} reset={vi.fn()} />);
    expect(message()).toBe("Too many requests, try again in 2 min");
  });

  test("RateLimited without a Retry-After says try again later", () => {
    render(<ErrorPage error={new RateLimited(undefined)} reset={vi.fn()} />);
    expect(message()).toBe("Too many requests, try again later");
  });

  test("IntervalsUnavailable says intervals.icu isn't responding", () => {
    render(<ErrorPage error={new IntervalsUnavailable()} reset={vi.fn()} />);
    expect(message()).toBe("intervals.icu isn't responding");
  });

  test.each([new Error("boom"), "not an error"])("anything else shows generic copy", (error) => {
    render(<ErrorPage error={error} reset={vi.fn()} />);
    expect(message()).toBe("Something went wrong loading your data");
  });

  test("Try again calls reset() and router.refresh()", () => {
    const reset = vi.fn();
    render(<ErrorPage error={new IntervalsUnavailable()} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
