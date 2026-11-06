"use client";

import { useMemo, useState } from "react";
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
  DEFAULT_RANGE,
  formSegmentColour,
  RANGES,
  toChartData,
  type Range,
} from "@/lib/training-load";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const FITNESS_COLOUR = "#3b82f6";
const FATIGUE_COLOUR = "#ec4899";
const FORM_DEFAULT_COLOUR = "#94a3b8";

const baseOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  elements: { point: { radius: 0 } },
  scales: { x: { ticks: { maxTicksLimit: 6, maxRotation: 0 } } },
};

const loadOptions: ChartOptions<"line"> = {
  ...baseOptions,
  plugins: { legend: { display: true } },
};

const formOptions: ChartOptions<"line"> = {
  ...baseOptions,
  plugins: { legend: { display: false } },
};

/**
 * Fitness/Fatigue and Form % charts with range chips. Gets the 1Y rows once;
 * switching range only re-slices them on the client.
 */
export function TrainingCharts({
  rows,
  today,
}: {
  rows: WellnessRow[];
  today: IsoDate;
}) {
  const [range, setRange] = useState<Range>(DEFAULT_RANGE);
  const data = useMemo(() => toChartData(rows, range, today), [rows, range, today]);

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
            onClick={() => setRange(r)}
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
      <h3>Fitness / Fatigue</h3>
      <div style={{ position: "relative", width: "100%", height: 220 }}>
        <Line data={loadData} options={loadOptions} aria-label="Fitness and Fatigue chart" />
      </div>
      <h3>Form %</h3>
      <div style={{ position: "relative", width: "100%", height: 160 }}>
        <Line data={formData} options={formOptions} aria-label="Form % chart" />
      </div>
    </section>
  );
}
