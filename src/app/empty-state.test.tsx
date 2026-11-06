// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { hasTrainingData } from "@/lib/training-load";
import { EmptyState } from "./empty-state";

vi.mock("./key-actions", () => ({ forgetKey: vi.fn() }));

afterEach(cleanup);

describe("EmptyState", () => {
  test("says there is no data, links to intervals.icu and offers Forget key", () => {
    render(<EmptyState />);

    expect(screen.getByText("No training data in intervals.icu yet")).toBeTruthy();
    expect(screen.getByRole("link", { name: "intervals.icu" })).toHaveProperty(
      "href",
      "https://intervals.icu/",
    );
    expect(screen.getByRole("button", { name: "Forget key" })).toBeTruthy();
  });
});

describe("hasTrainingData (when the empty state shows)", () => {
  test("no rows → empty", () => {
    expect(hasTrainingData([])).toBe(false);
  });

  test("all-null rows → empty", () => {
    expect(
      hasTrainingData([
        { date: "2026-10-01", fitness: null, fatigue: null },
        { date: "2026-10-02", fitness: 3, fatigue: null },
      ]),
    ).toBe(false);
  });

  test("all-zero rows are data → not empty (headline shows Not enough data)", () => {
    expect(
      hasTrainingData([
        { date: "2026-10-01", fitness: 0, fatigue: 0 },
        { date: "2026-10-02", fitness: null, fatigue: null },
      ]),
    ).toBe(true);
  });
});
