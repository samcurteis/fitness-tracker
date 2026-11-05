// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { Headline } from "./headline";

afterEach(cleanup);

function value(term: string): string | null | undefined {
  return screen.getByText(term, { selector: "dt" }).nextElementSibling
    ?.textContent;
}

describe("Headline", () => {
  test("shows the zone name and the three values", () => {
    render(
      <Headline
        current={{ fitness: 50.4, fatigue: 40.6, formPercent: 18, zone: "Fresh" }}
      />,
    );
    expect(screen.getByRole("heading").textContent).toBe("Fresh");
    expect(value("Fitness")).toBe("50");
    expect(value("Fatigue")).toBe("41");
    expect(value("Form %")).toBe("18%");
  });

  test("has no as of when the values are today's", () => {
    render(
      <Headline
        current={{ fitness: 50, fatigue: 40, formPercent: 20, zone: "Transition" }}
      />,
    );
    expect(screen.queryByText(/as of/)).toBeNull();
  });

  test("shows as of when the values are not today's", () => {
    render(
      <Headline
        current={{
          fitness: 50,
          fatigue: 40,
          formPercent: 20,
          zone: "Transition",
          asOf: "2026-11-03",
        }}
      />,
    );
    expect(screen.getByText("as of 2026-11-03")).toBeTruthy();
  });

  test("shows Not enough data and — when Form % is undefined", () => {
    render(
      <Headline
        current={{ fitness: 0, fatigue: 3, formPercent: undefined, zone: undefined }}
      />,
    );
    expect(screen.getByRole("heading").textContent).toBe("Not enough data");
    expect(value("Form %")).toBe("—");
    expect(screen.queryByTestId("zone-marker")).toBeNull();
  });

  test("renders the zone bar with the marker in the headline zone", () => {
    render(
      <Headline
        current={{ fitness: 100, fatigue: 109.6, formPercent: -10, zone: "Optimal" }}
      />,
    );
    expect(
      screen.getByTestId("zone-marker").closest("li")?.textContent,
    ).toContain("Optimal");
  });
});
