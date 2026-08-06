import {expect, it} from "vitest";
import { describeDb } from "../../test/dbTest";
import { importFixtures } from "./fixtureImport";

describeDb("importFixtures", () => {
  it("imports the deterministic stock universe", async () => {
    const summary = await importFixtures();

    expect(summary.markets).toBe(2);
    expect(summary.stocks).toBe(6);
    expect(summary.dailyPrices).toBe(6);
    expect(summary.annualFinancials).toBe(10);
    expect(summary.annualDividends).toBe(10);
  });
});
