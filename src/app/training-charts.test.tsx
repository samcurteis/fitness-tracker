// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { addDays } from "@/lib/dates";
import type { WellnessRow } from "@/lib/get-wellness";

type LineProps = {
  data: {
    labels: string[];
    datasets: { label: string; data: unknown[]; fill?: unknown; spanGaps?: unknown }[];
  };
};

const { Line, getWellness, refresh } = vi.hoisted(() => ({
  Line: vi.fn((props: LineProps) => {
    void props;
    return null;
  }),
  getWellness: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("react-chartjs-2", () => ({ Line }));
vi.mock("@/lib/get-wellness", () => ({ getWellness }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

import { TrainingCharts } from "./training-charts";

const today = "2026-11-06";
const rows: WellnessRow[] = [];
for (let d = "2025-11-06"; d <= today; d = addDays(d, 1)) {
  rows.push({ date: d, fitness: 50, fatigue: 40 });
}

/** Props of the latest render of each chart: [Fitness/Fatigue, Form %]. */
function latestCharts(): [LineProps, LineProps] {
  const calls = Line.mock.calls.map((c) => c[0]);
  const load = calls.findLast((p) => p.data.datasets.length === 2)!;
  const formPct = calls.findLast((p) => p.data.datasets.length === 1)!;
  return [load, formPct];
}

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  Line.mockClear();
  getWellness.mockClear();
  refresh.mockClear();
  fetchSpy = vi.spyOn(globalThis, "fetch");
});

afterEach(() => {
  cleanup();
  fetchSpy.mockRestore();
});

describe("TrainingCharts", () => {
  test("renders six chips with 42D selected by default", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    const chips = screen.getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual([
      "YTD",
      "1Y",
      "6M",
      "3M",
      "42D",
      "14D",
    ]);
    const pressed = chips.filter((c) => c.getAttribute("aria-pressed") === "true");
    expect(pressed.map((c) => c.textContent)).toEqual(["42D"]);
    const [load, formPct] = latestCharts();
    expect(load.data.labels).toHaveLength(42);
    expect(formPct.data.labels).toHaveLength(42);
  });

  test("clicking a chip changes both charts' data with no refetch", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    fireEvent.click(screen.getByRole("button", { name: "14D" }));

    expect(
      screen.getByRole("button", { name: "14D" }).getAttribute("aria-pressed"),
    ).toBe("true");
    const [load, formPct] = latestCharts();
    expect(load.data.labels).toHaveLength(14);
    expect(formPct.data.labels).toHaveLength(14);
    expect(load.data.datasets[0].data).toHaveLength(14);
    expect(formPct.data.datasets[0].data).toHaveLength(14);

    expect(getWellness).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  test("Fitness/Fatigue has two datasets, Form % one with no fill, none span gaps", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    const [load, formPct] = latestCharts();
    expect(load.data.datasets.map((d) => d.label)).toEqual(["Fitness", "Fatigue"]);
    expect(formPct.data.datasets).toHaveLength(1);
    expect(formPct.data.datasets[0].label).toBe("Form %");
    expect(formPct.data.datasets[0].fill).toBe(false);
    for (const d of [...load.data.datasets, ...formPct.data.datasets]) {
      expect(d.spanGaps).toBe(false);
    }
  });
});
