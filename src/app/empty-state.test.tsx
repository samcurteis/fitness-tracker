// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { EmptyState } from "./empty-state";

vi.mock("./key-actions", () => ({ forgetKey: vi.fn() }));

afterEach(cleanup);

describe("EmptyState", () => {
  test("says there is no data, links to intervals.icu and offers 'Forget key'", () => {
    render(<EmptyState />);

    expect(screen.getByText("No training data in intervals.icu yet")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /intervals.icu/i }).getAttribute("href"),
    ).toBe("https://intervals.icu");
    expect(screen.getByRole("button", { name: "Forget key" })).toBeTruthy();
  });
});
