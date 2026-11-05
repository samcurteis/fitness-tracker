// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { ZoneBar } from "./zone-bar";

afterEach(cleanup);

describe("ZoneBar", () => {
  test("lists the zones left to right", () => {
    render(<ZoneBar current="Fresh" />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((li) => li.textContent?.replace("▲", ""))).toEqual([
      "Transition",
      "Fresh",
      "Grey zone",
      "Optimal",
      "High risk",
    ]);
  });

  test("puts the marker in the current zone", () => {
    render(<ZoneBar current="Optimal" />);
    const markers = screen.getAllByTestId("zone-marker");
    expect(markers).toHaveLength(1);
    const item = markers[0].closest("li");
    expect(item?.textContent).toContain("Optimal");
    expect(item?.getAttribute("aria-current")).toBe("true");
  });

  test("shows no marker when there is no zone", () => {
    render(<ZoneBar current={undefined} />);
    expect(screen.queryByTestId("zone-marker")).toBeNull();
  });
});
