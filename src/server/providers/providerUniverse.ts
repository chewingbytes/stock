import { basename } from "node:path";
import { readCsv } from "../csv/readCsv";
import type { ProviderUniverseRow } from "./types";

const requiredFields: Array<keyof ProviderUniverseRow> = [
  "marketCode",
  "exchange",
  "stockCode",
  "stockName",
  "currency",
  "providerSymbol",
];

function validateRow(
  row: Record<string, string>,
  filePath: string,
  index: number,
): ProviderUniverseRow {
  for (const field of requiredFields) {
    if (!row[field] || row[field].trim() === "") {
      throw new Error(`Missing ${field} in ${basename(filePath)} row ${index + 1}`);
    }
  }

  return {
    marketCode: row.marketCode.trim(),
    exchange: row.exchange.trim(),
    stockCode: row.stockCode.trim(),
    stockName: row.stockName.trim(),
    currency: row.currency.trim(),
    providerSymbol: row.providerSymbol.trim(),
  };
}

export async function readProviderUniverseFiles(
  paths: string[],
): Promise<ProviderUniverseRow[]> {
  const rows: ProviderUniverseRow[] = [];

  for (const path of paths) {
    const rawRows = await readCsv<Record<string, string>>(path);
    rows.push(...rawRows.map((row, index) => validateRow(row, path, index)));
  }

  return rows;
}
