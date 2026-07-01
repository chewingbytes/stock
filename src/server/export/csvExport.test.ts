import { describe, expect, it } from "vitest";
import { buildScreenCsv } from "./csvExport";

describe("buildScreenCsv", () => {
  it("includes criteria and rows", () => {
    const csv = buildScreenCsv({
      generatedAt: new Date("2026-05-02T00:00:00.000Z"),
      criteria: [{ metricKey: "pe_ratio", min: 1, max: 40 }],
      rows: [
        {
          marketCode: "US",
          exchange: "NASDAQ",
          stockCode: "AAPL",
          stockName: "Apple Inc.",
          currency: "USD",
          metrics: {
            pe_ratio: {
              value: 25.98,
              dataQuality: "complete",
              reason: null,
              currency: null,
            },
          },
        },
      ],
    });

    expect(csv).toContain("Generated At,2026-05-02T00:00:00.000Z");
    expect(csv).toContain("Metric,Minimum,Maximum");
    expect(csv).toContain("pe_ratio,1,40");
    expect(csv).toContain("US,NASDAQ,AAPL,Apple Inc.,USD,25.98");
  });
});
