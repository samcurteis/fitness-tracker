"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData as ChartJsData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { IsoDate } from "@/lib/dates";
import type { WellnessRow } from "@/lib/get-wellness";
import {
  currentValues,
  DEFAULT_RANGE,
  displayedFormPercent,
  formSegmentColour,
  RANGES,
  toChartData,
  type Range,
} from "@/lib/training-load";
import { HoverReadout, type ReadoutDay } from "./hover-readout";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const FITNESS_COLOUR = "#3b82f6";
const FATIGUE_COLOUR = "#ec4899";
const FORM_DEFAULT_COLOUR = "#94a3b8";

const baseOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  // A tap anywhere on a day's x position picks that day (phones).
  interaction: { mode: "index", intersect: false },
  elements: { point: { radius: 0 } },
  scales: { x: { ticks: { maxTicksLimit: 6, maxRotation: 0 } } },
};

type LineChart = ChartJS<"line", (number | null)[], IsoDate>;

/** Datasets per chart: Fitness + Fatigue; Form %. */
const LOAD_DATASETS = 2;
const FORM_DATASETS = 1;

/** Highlight day `index` on `chart` (each of its datasets, plus tooltip); clear when null. */
function highlight(chart: LineChart | null, datasets: number, index: number | null) {
  if (!chart) return;
  const active =
    index === null
      ? []
      : Array.from({ length: datasets }, (_, datasetIndex) => ({ datasetIndex, index }));
  chart.setActiveElements(active);
  const point = index === null ? undefined : chart.getDatasetMeta?.(0)?.data[index];
  chart.tooltip?.setActiveElements(active, { x: point?.x ?? 0, y: point?.y ?? 0 });
  chart.update?.();
}

/** The current day for the idle readout: same day and values as the headline. */
function idleDay(rows: readonly WellnessRow[], today: IsoDate): ReadoutDay {
  const current = currentValues(rows, today);
  if (!current) return { date: today, fitness: null, fatigue: null, formPercent: null };
  return {
    date: current.asOf ?? today,
    fitness: current.fitness,
    fatigue: current.fatigue,
    formPercent: current.formPercent ?? null,
  };
}

/**
 * Fitness/Fatigue and Form % charts with range chips. Gets the 1Y rows once;
 * switching range only re-slices them on the client. Hovering a day on either
 * chart shows it in the shared readout and highlights it on the other chart.
 */
export function TrainingCharts({
  rows,
  today,
}: {
  rows: WellnessRow[];
  today: IsoDate;
}) {
  const [range, setRange] = useState<Range>(DEFAULT_RANGE);
  const [hovered, setHovered] = useState<number | null>(null);
  const loadRef = useRef<LineChart>(null);
  const formRef = useRef<LineChart>(null);
  const data = useMemo(() => toChartData(rows, range, today), [rows, range, today]);

  const day: ReadoutDay =
    hovered !== null && hovered < data.labels.length
      ? {
          date: data.labels[hovered],
          fitness: data.fitness[hovered],
          fatigue: data.fatigue[hovered],
          formPercent:
            displayedFormPercent({
              fitness: data.fitness[hovered],
              fatigue: data.fatigue[hovered],
            }) ?? null,
        }
      : idleDay(rows, today);

  function clearHover() {
    setHovered(null);
    highlight(loadRef.current, LOAD_DATASETS, null);
    highlight(formRef.current, FORM_DATASETS, null);
  }

  // One rule for touch and mouse: while a day is shown, a pointer outside both
  // charts (headings included) returns the readout to the current day.
  const loadBoxRef = useRef<HTMLDivElement>(null);
  const formBoxRef = useRef<HTMLDivElement>(null);
  const showingDay = hovered !== null;
  useEffect(() => {
    if (!showingDay) return;
    const onPointer = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        (loadBoxRef.current?.contains(target) || formBoxRef.current?.contains(target))
      ) {
        return;
      }
      setHovered(null);
      highlight(loadRef.current, LOAD_DATASETS, null);
      highlight(formRef.current, FORM_DATASETS, null);
    };
    const events = ["pointerdown", "touchstart", "pointermove", "mouseover"] as const;
    for (const type of events) {
      document.addEventListener(type, onPointer, { passive: true });
    }
    return () => {
      for (const type of events) document.removeEventListener(type, onPointer);
    };
  }, [showingDay]);

  const loadOptions: ChartOptions<"line"> = {
    ...baseOptions,
    onHover: (_event, elements) => {
      const index = elements[0]?.index ?? null;
      setHovered(index);
      highlight(formRef.current, FORM_DATASETS, index);
    },
    plugins: { legend: { display: true } },
  };

  const formOptions: ChartOptions<"line"> = {
    ...baseOptions,
    onHover: (_event, elements) => {
      const index = elements[0]?.index ?? null;
      setHovered(index);
      highlight(loadRef.current, LOAD_DATASETS, index);
    },
    plugins: { legend: { display: false } },
  };

  const loadData: ChartJsData<"line", (number | null)[], IsoDate> = {
    labels: data.labels,
    datasets: [
      {
        label: "Fitness",
        data: data.fitness,
        borderColor: FITNESS_COLOUR,
        backgroundColor: FITNESS_COLOUR,
        spanGaps: false,
      },
      {
        label: "Fatigue",
        data: data.fatigue,
        borderColor: FATIGUE_COLOUR,
        backgroundColor: FATIGUE_COLOUR,
        spanGaps: false,
      },
    ],
  };

  const formData: ChartJsData<"line", (number | null)[], IsoDate> = {
    labels: data.labels,
    datasets: [
      {
        label: "Form %",
        data: data.formPercent,
        borderColor: FORM_DEFAULT_COLOUR,
        fill: false,
        spanGaps: false,
        segment: {
          borderColor: (ctx) =>
            formSegmentColour(ctx.p0.parsed.y, ctx.p1.parsed.y) ?? undefined,
        },
      },
    ],
  };

  return (
    <section aria-label="Training load charts" style={{ maxWidth: "100%" }}>
      <div
        role="group"
        aria-label="Range"
        style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "8px 0" }}
      >
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={r === range}
            onClick={() => {
              setRange(r);
              clearHover();
            }}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #94a3b8",
              background: r === range ? "#1e293b" : "transparent",
              color: r === range ? "#fff" : "inherit",
            }}
          >
            {r}
          </button>
        ))}
      </div>
      <HoverReadout day={day} />
      <div onMouseLeave={clearHover}>
        <h3>Fitness / Fatigue</h3>
        <div ref={loadBoxRef} style={{ position: "relative", width: "100%", height: 220 }}>
          <Line
            ref={loadRef}
            data={loadData}
            options={loadOptions}
            aria-label="Fitness and Fatigue chart"
          />
        </div>
        <h3>Form %</h3>
        <div ref={formBoxRef} style={{ position: "relative", width: "100%", height: 160 }}>
          <Line
            ref={formRef}
            data={formData}
            options={formOptions}
            aria-label="Form % chart"
          />
        </div>
      </div>
    </section>
  );
}
