import type { RangeFilter } from "../../domain/types";
import type { ScreenRow } from "../screener/screenerService";

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
  const metricKeys = Array.from(
    new Set(input.criteria.map((criterion) => criterion.metricKey)),
  );

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
    ["Market", "Exchange", "Stock Code", "Stock Name", "Currency", ...metricKeys]
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
        ...metricKeys.map(
          (key) => row.metrics[key]?.value ?? row.metrics[key]?.dataQuality ?? "",
        ),
      ]
        .map(cell)
        .join(","),
    );
  }

  return `${lines.join("\n")}\n`;
}
