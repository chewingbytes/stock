import {expect, it} from "vitest";
import { describeDb } from "../../test/dbTest";
import { importFixtures } from "../import/fixtureImport";
import { recomputeMetrics } from "../metrics/recomputeMetrics";
import { runScreen } from "./screenerService";

describeDb("runScreen", () => {
  it("filters US stocks by P/E range", async () => {
    await importFixtures();
    await recomputeMetrics();

    const result = await runScreen({
      markets: ["US"],
      filters: [{ metricKey: "pe_ratio", min: 1, max: 40 }],
      sort: { metricKey: "pe_ratio", direction: "asc" },
      page: 1,
      pageSize: 20,
    });

    expect(result.rows.some((row) => row.stockCode === "AAPL")).toBe(true);
    expect(result.rows.every((row) => row.marketCode === "US")).toBe(true);
    expect(result.criteria).toEqual([
      { metricKey: "pe_ratio", min: 1, max: 40 },
    ]);
    expect(result.universeTotal).toBeGreaterThanOrEqual(result.total);
    expect(result.filteredOut).toBe(result.universeTotal - result.total);
  });

  it("returns missing metric markers without hiding unfiltered stocks", async () => {
    await importFixtures();
    await recomputeMetrics();

    const result = await runScreen({
      markets: ["SGX"],
      filters: [],
      sort: { metricKey: "stock_code", direction: "asc" },
      page: 1,
      pageSize: 20,
    });

    const missing = result.rows.find((row) => row.stockCode === "MISS");

    expect(missing).toBeDefined();
    expect(missing?.metrics.pe_ratio?.dataQuality).toBe("missing");
  });
});
