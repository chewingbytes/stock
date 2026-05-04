import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { readProviderUniverseFiles } from "./providerUniverse";

async function writeTempCsv(fileName: string, content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "provider-universe-"));
  const filePath = join(dir, fileName);
  await writeFile(filePath, content, "utf8");
  return filePath;
}

describe("readProviderUniverseFiles", () => {
  it("reads a valid sample CSV and returns trimmed ProviderUniverseRow values", async () => {
    const filePath = await writeTempCsv(
      "sample.csv",
      [
        "marketCode,exchange,stockCode,stockName,currency,providerSymbol",
        " US , NASDAQ , AAPL , Apple Inc , USD , AAPL ",
      ].join("\n"),
    );

    await expect(readProviderUniverseFiles([filePath])).resolves.toEqual([
      {
        marketCode: "US",
        exchange: "NASDAQ",
        stockCode: "AAPL",
        stockName: "Apple Inc",
        currency: "USD",
        providerSymbol: "AAPL",
      },
    ]);
  });

  it("rejects a missing required field", async () => {
    const filePath = await writeTempCsv(
      "bad.csv",
      [
        "marketCode,exchange,stockCode,stockName,currency,providerSymbol",
        "US,NASDAQ,AAPL,,USD,AAPL",
      ].join("\n"),
    );

    await expect(readProviderUniverseFiles([filePath])).rejects.toThrow(
      "Missing stockName in bad.csv row 1",
    );
  });
});
