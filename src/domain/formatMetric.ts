import type { MetricKey } from "./types";

/**
 * How each metric should render. Growth rates and yields are stored as
 * percentages (e.g. 4.21 = 4.21%); ratios are plain multiples.
 */
const metricFormat: Record<MetricKey, "compact" | "percent" | "ratio" | "price"> =
  {
    market_cap: "compact",
    volume: "compact",
    revenue_growth_rate: "percent",
    profit_growth_rate: "percent",
    dividend_yield: "percent",
    dividend_growth_rate: "percent",
    pe_ratio: "ratio",
    pb_ratio: "ratio",
    debt_to_equity_ratio: "ratio",
    open: "price",
    high: "price",
    low: "price",
    close: "price",
    week52_high: "price",
    week52_low: "price",
  };

export type MetricFormat = "compact" | "percent" | "ratio" | "price";

export function getMetricFormat(metricKey: MetricKey | string): MetricFormat {
  return metricFormat[metricKey as MetricKey] ?? "ratio";
}

/**
 * Column header for exports. Values stay raw in the CSV so spreadsheets can
 * sort and compute, so the unit belongs in the header.
 */
export function formatMetricCsvHeader(
  metricKey: MetricKey | string,
  label: string,
): string {
  switch (getMetricFormat(metricKey)) {
    case "percent":
      return `${label} (%)`;
    case "ratio":
      return `${label} (x)`;
    default:
      return label;
  }
}

/** 3_502_000_000_000 -> "3.50T" */
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  const units: Array<[number, string]> = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];

  for (const [size, suffix] of units) {
    if (abs >= size) {
      return `${(value / size).toFixed(2)}${suffix}`;
    }
  }

  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Renders a metric value for display. Returns "N/A" for missing values so
 * callers can pass raw metric payloads straight through.
 */
export function formatMetricValue(
  metricKey: MetricKey | string,
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }

  const format = metricFormat[metricKey as MetricKey];

  switch (format) {
    case "compact":
      return formatCompactNumber(value);
    case "percent":
      return `${value.toFixed(2)}%`;
    case "ratio":
      return `${value.toFixed(2)}x`;
    case "price":
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}
