import { z } from "zod";
import type { MetricKey, RangeFilter } from "./types";

export const metricKeys = [
  "market_cap",
  "revenue_growth_rate",
  "profit_growth_rate",
  "dividend_yield",
  "dividend_growth_rate",
  "pe_ratio",
  "pb_ratio",
  "debt_to_equity_ratio",
  "open",
  "high",
  "low",
  "close",
  "volume",
  "week52_high",
  "week52_low",
] as const satisfies readonly MetricKey[];

const rangeFilterSchema = z.object({
  metricKey: z.enum(metricKeys),
  min: z.number().finite().nullable(),
  max: z.number().finite().nullable(),
});

export type ValidationError = {
  field: string;
  message: string;
};

export type FilterValidationResult =
  | { ok: true; filters: RangeFilter[] }
  | { ok: false; errors: ValidationError[] };

export function validateRangeFilters(input: unknown): FilterValidationResult {
  if (!Array.isArray(input)) {
    return {
      ok: false,
      errors: [{ field: "filters", message: "Filters must be an array." }],
    };
  }

  const errors: ValidationError[] = [];
  const filters: RangeFilter[] = [];

  input.forEach((item, index) => {
    const parsed = rangeFilterSchema.safeParse(item);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = String(issue.path[0] ?? "value");
      errors.push({
        field: `filters.${index}.${field}`,
        message:
          issue.path[0] === "metricKey"
            ? "Unsupported metric key."
            : issue.message,
      });
      return;
    }

    if (
      parsed.data.min !== null &&
      parsed.data.max !== null &&
      parsed.data.max < parsed.data.min
    ) {
      errors.push({
        field: `filters.${index}.max`,
        message: "Maximum must be greater than or equal to minimum.",
      });
      return;
    }

    filters.push(parsed.data);
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, filters };
}
