// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { addDays } from "@/lib/dates";
import type { WellnessRow } from "@/lib/get-wellness";
import { currentValues, displayedFormPercent } from "@/lib/training-load";

type OnHover = (event: unknown, elements: { index: number }[], chart: unknown) => void;

type LineProps = {
  "aria-label": string;
  data: { labels: string[] };
  options: { onHover?: OnHover; interaction?: unknown };
  ref?: { current: unknown } | null;
};

const LOAD = "Fitness and Fatigue chart";
const FORM = "Form % chart";

function fakeChart() {
  return {
    setActiveElements: vi.fn(),
    tooltip: { setActiveElements: vi.fn() },
    update: vi.fn(),
  };
}

const { Line, charts } = vi.hoisted(() => {
  const charts: Record<string, ReturnType<typeof fakeChart>> = {};
  const Line = vi.fn((props: LineProps) => {
    if (props.ref && typeof props.ref === "object") {
      props.ref.current = charts[props["aria-label"]];
    }
    return <canvas aria-label={props["aria-label"]} />;
  });
  return { Line, charts };
});

vi.mock("react-chartjs-2", () => ({ Line }));

import { TrainingCharts } from "./training-charts";

const today = "2026-11-06";
const gapDate = addDays(today, -5);

function makeRows(last: string): WellnessRow[] {
  const rows: WellnessRow[] = [];
  let k = 0;
  for (let d = "2025-11-06"; d <= last; d = addDays(d, 1), k++) {
    if (d === gapDate) {
      rows.push({ date: d, fitness: null, fatigue: null });
    } else {
      rows.push({ date: d, fitness: 50 + (k % 7) * 1.3, fatigue: 40 + (k % 5) * 3.7 });
    }
  }
  return rows;
}

const rows = makeRows(today);

function latest(label: string): LineProps {
  return Line.mock.calls.map((c) => c[0]).findLast((p) => p["aria-label"] === label)!;
}

function hover(label: string, index: number | null) {
  act(() => {
    latest(label).options.onHover!({}, index === null ? [] : [{ index }], {});
  });
}

function readout() {
  const region = screen.getByRole("region", { name: "Readout" });
  const value = (term: string) =>
    within(region).getByText(term, { selector: "dt" }).nextElementSibling?.textContent;
  return {
    region,
    text: region.textContent,
    fitness: value("Fitness"),
    fatigue: value("Fatigue"),
    formPercent: value("Form %"),
  };
}

function expectDay(date: string, rowList: WellnessRow[] = rows) {
  const row = rowList.find((r) => r.date === date)!;
  const r = readout();
  expect(r.text).toContain(date);
  expect(r.fitness).toBe(String(Math.round(row.fitness!)));
  expect(r.fatigue).toBe(String(Math.round(row.fatigue!)));
  expect(r.formPercent).toBe(`${displayedFormPercent(row)}%`);
}

function expectIdle(rowList: WellnessRow[] = rows) {
  const current = currentValues(rowList, today)!;
  const r = readout();
  expect(r.text).toContain(current.asOf ?? today);
  expect(r.fitness).toBe(String(Math.round(current.fitness)));
  expect(r.fatigue).toBe(String(Math.round(current.fatigue)));
  expect(r.formPercent).toBe(`${current.formPercent}%`);
}

beforeEach(() => {
  Line.mockClear();
  charts[LOAD] = fakeChart();
  charts[FORM] = fakeChart();
});

afterEach(cleanup);

describe("hover readout", () => {
  test("idle shows current day", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    expectIdle();
  });

  test("idle shows the fallback day when today has no values", () => {
    const stale = makeRows(addDays(today, -2));
    render(<TrainingCharts rows={stale} today={today} />);
    expect(currentValues(stale, today)?.asOf).toBe(addDays(today, -2));
    expectIdle(stale);
  });

  test("hovering index i on the Fitness/Fatigue chart shows day i", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    const labels = latest(LOAD).data.labels;
    hover(LOAD, 10);
    expectDay(labels[10]);
  });

  test("hovering index i on the Form % chart shows day i", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    const labels = latest(FORM).data.labels;
    hover(FORM, 20);
    expectDay(labels[20]);
  });

  test("hovering one chart highlights the same day on the other", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    hover(LOAD, 7);
    const formActive = [{ datasetIndex: 0, index: 7 }];
    expect(charts[FORM].setActiveElements).toHaveBeenLastCalledWith(formActive);
    expect(charts[FORM].tooltip.setActiveElements).toHaveBeenLastCalledWith(
      formActive,
      expect.anything(),
    );

    hover(FORM, 3);
    const loadActive = [
      { datasetIndex: 0, index: 3 },
      { datasetIndex: 1, index: 3 },
    ];
    expect(charts[LOAD].setActiveElements).toHaveBeenLastCalledWith(loadActive);
    expect(charts[LOAD].tooltip.setActiveElements).toHaveBeenLastCalledWith(
      loadActive,
      expect.anything(),
    );
  });

  test("both charts use index mode without intersect", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    for (const label of [LOAD, FORM]) {
      expect(latest(label).options.interaction).toEqual({ mode: "index", intersect: false });
    }
  });

  test("hover end returns to the current day", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    hover(LOAD, 10);
    hover(LOAD, null);
    expectIdle();
    expect(charts[FORM].setActiveElements).toHaveBeenLastCalledWith([]);

    hover(FORM, 4);
    fireEvent.mouseLeave(screen.getByLabelText(FORM).closest("div")!.parentElement!);
    expectIdle();
  });

  test("hovering a null day shows the date and —", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    const index = latest(LOAD).data.labels.indexOf(gapDate);
    expect(index).toBeGreaterThanOrEqual(0);
    hover(LOAD, index);
    const r = readout();
    expect(r.text).toContain(gapDate);
    expect(r.fitness).toBe("—");
    expect(r.fatigue).toBe("—");
    expect(r.formPercent).toBe("—");
  });

  test("changing the range chip while hovering resets to the current day", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    hover(LOAD, 10);
    fireEvent.click(screen.getByRole("button", { name: "14D" }));
    expectIdle();
  });

  test("readout comes before both charts", () => {
    render(<TrainingCharts rows={rows} today={today} />);
    const { region } = readout();
    for (const label of [LOAD, FORM]) {
      const chart = screen.getByLabelText(label);
      expect(
        region.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });
});
