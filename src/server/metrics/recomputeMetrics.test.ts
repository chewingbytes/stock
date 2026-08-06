import {expect, it} from "vitest";
import { describeDb } from "../../test/dbTest";
import { prisma } from "../db";
import { importFixtures } from "../import/fixtureImport";
import { recomputeMetrics } from "./recomputeMetrics";

describeDb("recomputeMetrics", () => {
  it("creates complete and unavailable derived metrics", async () => {
    await importFixtures();

    const summary = await recomputeMetrics();

    expect(summary.stocksProcessed).toBe(6);
    expect(summary.metricsWritten).toBeGreaterThan(0);

    const applePe = await prisma.derivedMetric.findFirstOrThrow({
      where: { metricKey: "pe_ratio", stock: { stockCode: "AAPL" } },
    });

    expect(applePe.dataQuality).toBe("complete");
    expect(Number(applePe.value)).toBeGreaterThan(0);

    const lossPe = await prisma.derivedMetric.findFirstOrThrow({
      where: { metricKey: "pe_ratio", stock: { stockCode: "LOSS" } },
    });

    expect(lossPe.dataQuality).toBe("unavailable");
    expect(lossPe.reason).toBe("earnings_per_share_not_positive");
  });
});
