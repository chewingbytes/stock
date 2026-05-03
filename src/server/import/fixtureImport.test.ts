import { describe, expect, it } from "vitest";
import { importFixtures } from "./fixtureImport";

describe("importFixtures", () => {
  it("imports the deterministic stock universe", async () => {
    const summary = await importFixtures();

    expect(summary.markets).toBe(2);
    expect(summary.stocks).toBe(6);
    expect(summary.dailyPrices).toBe(6);
    expect(summary.annualFinancials).toBe(10);
    expect(summary.annualDividends).toBe(10);
  });
});
