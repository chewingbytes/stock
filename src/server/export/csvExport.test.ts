import { describe, expect, it } from "vitest";
import { buildScreenCsv } from "./csvExport";

const row = {
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
    close: {
      value: 212.44,
      dataQuality: "complete",
      reason: null,
      currency: "USD",
    },
    market_cap: {
      value: 3_150_000_000_000,
      dataQuality: "complete",
      reason: null,
      currency: "USD",
    },
    volume: {
      value: 41_000_000,
      dataQuality: "complete",
      reason: null,
      currency: null,
    },
    week52_high: {
      value: 260.1,
      dataQuality: "complete",
      reason: null,
      currency: "USD",
    },
    week52_low: {
      value: 169.21,
      dataQuality: "complete",
      reason: null,
      currency: "USD",
    },
  },
};

describe("buildScreenCsv", () => {
  it("includes criteria and rows", () => {
    const csv = buildScreenCsv({
      generatedAt: new Date("2026-05-02T00:00:00.000Z"),
      criteria: [{ metricKey: "pe_ratio", min: 1, max: 40 }],
      rows: [row],
    });

    expect(csv).toContain("Generated At,2026-05-02T00:00:00.000Z");
    expect(csv).toContain("Metric,Minimum,Maximum");
    expect(csv).toContain("pe_ratio,1,40");
    expect(csv).toContain("US,NASDAQ,AAPL,Apple Inc.,USD,");
  });

  it("exports the core headline columns even when they are not filtered", () => {
    const csv = buildScreenCsv({
      generatedAt: new Date("2026-05-02T00:00:00.000Z"),
      criteria: [{ metricKey: "pe_ratio", min: 1, max: 40 }],
      rows: [row],
    });

    const header = csv.split("\n").find((line) => line.startsWith("Market,"));

    expect(header).toContain("Close Price");
    expect(header).toContain("Market Cap");
    expect(header).toContain("P/E Ratio (x)");
    expect(header).toContain("Dividend Yield (%)");
    expect(header).toContain("52W High");
    expect(header).toContain("52W Low");
    expect(header).toContain("Volume");

    // Raw values are exported so spreadsheets can sort and compute.
    const dataLine = csv.split("\n").find((line) => line.includes("AAPL"));
    expect(dataLine).toContain("3150000000000");
    expect(dataLine).toContain("212.44");
    expect(dataLine).toContain("41000000");
  });

  it("falls back to the data-quality status when a value is missing", () => {
    const csv = buildScreenCsv({
      generatedAt: new Date("2026-05-02T00:00:00.000Z"),
      criteria: [],
      rows: [
        {
          ...row,
          metrics: {
            ...row.metrics,
            dividend_yield: {
              value: null,
              dataQuality: "missing",
              reason: "dividend_per_share_missing",
              currency: null,
            },
          },
        },
      ],
    });

    expect(csv.split("\n").find((line) => line.includes("AAPL"))).toContain(
      "missing",
    );
  });
});
