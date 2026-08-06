import { formatMetricCsvHeader } from "../../domain/formatMetric";
import {
  buildDisplayMetricKeys,
  formatMetricLabel,
} from "../../domain/metricDefinitions";
import type { RangeFilter } from "../../domain/types";
import type { ScreenRow } from "../screener/screenerService";

/**
 * Trims binary floating-point noise (2.460000038146973 -> 2.46) while keeping
 * the value numeric so spreadsheets can still sort and compute on it.
 */
function exportNumber(value: number): number {
  return Number(value.toFixed(4));
}

function cell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);

  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replaceAll("\"", "\"\"")}"`;
  }

  return raw;
}

export function buildScreenCsv(input: {
  generatedAt: Date;
  criteria: RangeFilter[];
  rows: ScreenRow[];
}): string {
  const filteredKeys = Array.from(
    new Set(input.criteria.map((criterion) => criterion.metricKey)),
  );
  // Always export the headline figures, then any extra filtered metrics, so the
  // CSV matches what the results table shows.
  const metricKeys = buildDisplayMetricKeys(filteredKeys);

  const lines: string[] = [];
  lines.push(["Generated At", input.generatedAt.toISOString()].map(cell).join(","));
  lines.push("");
  lines.push(["Metric", "Minimum", "Maximum"].map(cell).join(","));

  for (const criterion of input.criteria) {
    lines.push(
      [criterion.metricKey, criterion.min ?? "", criterion.max ?? ""]
        .map(cell)
        .join(","),
    );
  }

  lines.push("");
  lines.push(
    [
      "Market",
      "Exchange",
      "Stock Code",
      "Stock Name",
      "Currency",
      ...metricKeys.map((key) =>
        formatMetricCsvHeader(key, formatMetricLabel(key)),
      ),
    ]
      .map(cell)
      .join(","),
  );

  for (const row of input.rows) {
    lines.push(
      [
        row.marketCode,
        row.exchange,
        row.stockCode,
        row.stockName,
        row.currency,
        // Raw numbers keep the export spreadsheet-friendly; fall back to the
        // quality status (e.g. "missing") when there is no value.
        ...metricKeys.map((key) => {
          const metric = row.metrics[key];
          if (metric?.value === null || metric?.value === undefined) {
            return metric?.dataQuality ?? "";
          }
          return exportNumber(metric.value);
        }),
      ]
        .map(cell)
        .join(","),
    );
  }

  return `${lines.join("\n")}\n`;
}
