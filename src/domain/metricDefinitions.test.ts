import { describe, expect, it } from "vitest";
import {
  beginnerMetricDefinitions,
  formatMetricLabel,
  getMetricDefinition,
} from "./metricDefinitions";

describe("metricDefinitions", () => {
  it("defines beginner explanations for the V1 starter metrics", () => {
    expect(beginnerMetricDefinitions.pe_ratio.label).toBe("P/E Ratio");
    expect(beginnerMetricDefinitions.dividend_yield.label).toBe("Dividend Yield");
    expect(beginnerMetricDefinitions.revenue_growth_rate.label).toBe(
      "Revenue Growth",
    );
    expect(beginnerMetricDefinitions.debt_to_equity_ratio.caution).toContain(
      "Debt",
    );
  });

  it("returns readable labels for supported metrics", () => {
    expect(formatMetricLabel("pb_ratio")).toBe("P/B Ratio");
    expect(getMetricDefinition("close").label).toBe("Close Price");
  });
});
