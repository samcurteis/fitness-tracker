// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { KeyForm } from "./key-form";

vi.mock("./key-actions", () => ({ submitKey: vi.fn() }));

afterEach(cleanup);

describe("KeyForm", () => {
  test("renders one key field, the settings link and the browser-only note", () => {
    const { container } = render(<KeyForm />);

    expect(container.querySelectorAll("input")).toHaveLength(1);
    expect(screen.getByLabelText(/api key/i)).toHaveProperty("name", "key");
    expect(
      screen.getByRole("link", { name: /intervals.icu settings/i }),
    ).toHaveProperty("href", "https://intervals.icu/settings");
    expect(screen.getByText(/stored only in this browser/i)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("shows the inline error when one is given", () => {
    render(<KeyForm error="intervals.icu rejected this key" />);
    expect(screen.getByRole("alert").textContent).toBe(
      "intervals.icu rejected this key",
    );
  });
});
