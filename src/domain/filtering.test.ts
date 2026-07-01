import { describe, expect, it } from "vitest";
import { validateRangeFilters } from "./filtering";

describe("validateRangeFilters", () => {
  it("accepts valid min and max filters", () => {
    expect(
      validateRangeFilters([
        { metricKey: "pe_ratio", min: 5, max: 20 },
        { metricKey: "dividend_yield", min: 0.02, max: null },
      ]),
    ).toEqual({
      ok: true,
      filters: [
        { metricKey: "pe_ratio", min: 5, max: 20 },
        { metricKey: "dividend_yield", min: 0.02, max: null },
      ],
    });
  });

  it("rejects unknown metric keys", () => {
    expect(
      validateRangeFilters([{ metricKey: "unknown", min: 1, max: 2 }]),
    ).toEqual({
      ok: false,
      errors: [
        {
          field: "filters.0.metricKey",
          message: "Unsupported metric key.",
        },
      ],
    });
  });

  it("rejects max lower than min", () => {
    expect(
      validateRangeFilters([{ metricKey: "pe_ratio", min: 20, max: 5 }]),
    ).toEqual({
      ok: false,
      errors: [
        {
          field: "filters.0.max",
          message: "Maximum must be greater than or equal to minimum.",
        },
      ],
    });
  });
});
