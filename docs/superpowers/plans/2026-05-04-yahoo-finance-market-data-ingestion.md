# Yahoo Finance Market Data Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a personal/internal Yahoo Finance ingestion path that imports a curated US and SGX stock universe into the existing local SQLite data hub.

**Architecture:** Keep the frontend and screener API provider-agnostic. Add a server-side provider boundary, a `yahoo-finance2` client adapter, a normalized import service, a CLI runner, curated universe CSVs, and docs. Existing metric recomputation remains the only layer that creates screenable ratios.

**Tech Stack:** Next.js, TypeScript, Prisma, SQLite, Vitest, `csv-parse`, `yahoo-finance2`.

---

## File Structure

- Create `data/provider-universe/us.csv`: curated US provider symbols.
- Create `data/provider-universe/sg.csv`: curated SGX provider symbols.
- Create `src/server/providers/types.ts`: provider-neutral row and data shapes.
- Create `src/server/providers/providerUniverse.ts`: parse and validate universe CSV files.
- Create `src/server/providers/providerUniverse.test.ts`: unit tests for CSV parsing and validation.
- Create `src/server/providers/yahooFinanceClient.ts`: thin `yahoo-finance2` wrapper that maps Yahoo responses to provider-neutral data.
- Create `src/server/providers/yahooFinanceClient.test.ts`: unit tests with mocked Yahoo-like responses.
- Create `src/server/import/providerImport.ts`: normalize provider-neutral data into Prisma tables and import-run records.
- Create `src/server/import/providerImport.test.ts`: integration-style tests using fake providers.
- Create `src/server/import/runYahooFinanceImport.ts`: CLI runner for manual imports.
- Modify `package.json`: add `yahoo-finance2` dependency and `import:yahoo` script.
- Modify `README.md`: document personal/internal Yahoo Finance import workflow and caveats.

The plan deliberately avoids schema changes. The current Prisma models already include `Market`, `Stock`, `DailyPrice`, `AnnualFinancial`, `AnnualDividend`, `MarketCap`, `DerivedMetric`, and `ImportRun`.

---

### Task 1: Dependency And Script

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add the dependency**

Run:

```powershell
npm install yahoo-finance2
```

Expected: `package.json` and `package-lock.json` update successfully.

- [ ] **Step 2: Add the import script**

Modify `package.json` so the scripts section includes:

```json
{
  "import:yahoo": "tsx src/server/import/runYahooFinanceImport.ts"
}
```

Keep the existing scripts unchanged. The resulting scripts section should include these relevant entries:

```json
{
  "import:fixtures": "tsx src/server/import/runFixtureImport.ts",
  "import:yahoo": "tsx src/server/import/runYahooFinanceImport.ts",
  "metrics:recompute": "tsx src/server/metrics/runRecomputeMetrics.ts"
}
```

- [ ] **Step 3: Verify dependency installation**

Run:

```powershell
npm test
```

Expected: existing tests pass.

- [ ] **Step 4: Commit**

Run:

```powershell
git add package.json package-lock.json
git commit -m "chore: add yahoo finance dependency"
```

---

### Task 2: Provider Universe CSV Parsing

**Files:**
- Create: `data/provider-universe/us.csv`
- Create: `data/provider-universe/sg.csv`
- Create: `src/server/providers/types.ts`
- Create: `src/server/providers/providerUniverse.ts`
- Create: `src/server/providers/providerUniverse.test.ts`

- [ ] **Step 1: Create curated universe CSVs**

Create `data/provider-universe/us.csv`:

```csv
marketCode,exchange,stockCode,stockName,currency,providerSymbol
US,NASDAQ,AAPL,Apple Inc,USD,AAPL
US,NASDAQ,MSFT,Microsoft Corporation,USD,MSFT
US,NASDAQ,NVDA,NVIDIA Corporation,USD,NVDA
```

Create `data/provider-universe/sg.csv`:

```csv
marketCode,exchange,stockCode,stockName,currency,providerSymbol
SGX,SGX,D05,DBS Group Holdings,SGD,D05.SI
SGX,SGX,U11,United Overseas Bank,SGD,U11.SI
SGX,SGX,Z74,Singapore Telecommunications,SGD,Z74.SI
```

- [ ] **Step 2: Define provider-neutral types**

Create `src/server/providers/types.ts`:

```ts
export type ProviderUniverseRow = {
  marketCode: string;
  exchange: string;
  stockCode: string;
  stockName: string;
  currency: string;
  providerSymbol: string;
};

export type ProviderDailyPrice = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number | null;
  volume: number | null;
};

export type ProviderAnnualFinancial = {
  fiscalYear: number;
  revenue: number | null;
  profitBeforeTax: number | null;
  profitAfterTax: number | null;
  ebita: number | null;
  totalDebt: number | null;
  totalEquity: number | null;
  sharesOutstanding: number | null;
  earningsPerShare: number | null;
  bookValuePerShare: number | null;
};

export type ProviderAnnualDividend = {
  fiscalYear: number;
  dividendPerShare: number | null;
  currency: string;
};

export type ProviderMarketCap = {
  date: Date;
  marketCap: number;
  currency: string;
  calculationMethod: string;
};

export type ProviderStockData = {
  row: ProviderUniverseRow;
  dailyPrices: ProviderDailyPrice[];
  annualFinancials: ProviderAnnualFinancial[];
  annualDividends: ProviderAnnualDividend[];
  marketCaps: ProviderMarketCap[];
  warnings: string[];
};

export type MarketDataProvider = {
  source: string;
  fetchStock(row: ProviderUniverseRow): Promise<ProviderStockData>;
};
```

- [ ] **Step 3: Write the failing parser test**

Create `src/server/providers/providerUniverse.test.ts`:

```ts
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { readProviderUniverseFiles } from "./providerUniverse";

describe("readProviderUniverseFiles", () => {
  it("reads and validates provider symbol mapping CSVs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "provider-universe-"));
    const csvPath = join(dir, "sample.csv");
    await writeFile(
      csvPath,
      [
        "marketCode,exchange,stockCode,stockName,currency,providerSymbol",
        "SGX,SGX,D05,DBS Group Holdings,SGD,D05.SI",
      ].join("\n"),
      "utf8",
    );

    const rows = await readProviderUniverseFiles([csvPath]);

    expect(rows).toEqual([
      {
        marketCode: "SGX",
        exchange: "SGX",
        stockCode: "D05",
        stockName: "DBS Group Holdings",
        currency: "SGD",
        providerSymbol: "D05.SI",
      },
    ]);
  });

  it("rejects rows with missing required fields", async () => {
    const dir = await mkdtemp(join(tmpdir(), "provider-universe-"));
    const csvPath = join(dir, "bad.csv");
    await writeFile(
      csvPath,
      [
        "marketCode,exchange,stockCode,stockName,currency,providerSymbol",
        "SGX,SGX,D05,,SGD,D05.SI",
      ].join("\n"),
      "utf8",
    );

    await expect(readProviderUniverseFiles([csvPath])).rejects.toThrow(
      "Missing stockName in bad.csv row 1",
    );
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run:

```powershell
npm test -- src/server/providers/providerUniverse.test.ts
```

Expected: FAIL because `providerUniverse.ts` does not exist.

- [ ] **Step 5: Implement the parser**

Create `src/server/providers/providerUniverse.ts`:

```ts
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
```

- [ ] **Step 6: Run the parser test**

Run:

```powershell
npm test -- src/server/providers/providerUniverse.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add data/provider-universe/us.csv data/provider-universe/sg.csv src/server/providers/types.ts src/server/providers/providerUniverse.ts src/server/providers/providerUniverse.test.ts
git commit -m "feat: add provider universe parsing"
```

---

### Task 3: Yahoo Finance Client Adapter

**Files:**
- Create: `src/server/providers/yahooFinanceClient.ts`
- Create: `src/server/providers/yahooFinanceClient.test.ts`

- [ ] **Step 1: Write the failing adapter tests**

Create `src/server/providers/yahooFinanceClient.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createYahooFinanceProvider } from "./yahooFinanceClient";
import type { ProviderUniverseRow } from "./types";

const row: ProviderUniverseRow = {
  marketCode: "US",
  exchange: "NASDAQ",
  stockCode: "AAPL",
  stockName: "Apple Inc",
  currency: "USD",
  providerSymbol: "AAPL",
};

describe("createYahooFinanceProvider", () => {
  it("maps Yahoo historical, quote, and summary data to provider-neutral data", async () => {
    const provider = createYahooFinanceProvider({
      now: () => new Date("2026-05-04T00:00:00.000Z"),
      yahoo: {
        historical: async () => [
          {
            date: new Date("2026-05-01T00:00:00.000Z"),
            open: 200,
            high: 205,
            low: 198,
            close: 204,
            adjClose: 203,
            volume: 123456,
          },
        ],
        quote: async () => ({
          marketCap: 3000000000000,
          currency: "USD",
        }),
        quoteSummary: async () => ({
          incomeStatementHistory: {
            incomeStatementHistory: [
              {
                endDate: new Date("2025-09-30T00:00:00.000Z"),
                totalRevenue: 1000,
                pretaxIncome: 300,
                netIncome: 250,
                ebit: 280,
              },
            ],
          },
          balanceSheetHistory: {
            balanceSheetStatements: [
              {
                endDate: new Date("2025-09-30T00:00:00.000Z"),
                totalDebt: 400,
                totalStockholderEquity: 800,
              },
            ],
          },
          defaultKeyStatistics: {
            sharesOutstanding: 100,
            trailingEps: 2.5,
            bookValue: 8,
          },
          summaryDetail: {
            dividendRate: 1,
          },
        }),
      },
    });

    const data = await provider.fetchStock(row);

    expect(data.source).toBeUndefined();
    expect(data.dailyPrices).toHaveLength(1);
    expect(data.dailyPrices[0].close).toBe(204);
    expect(data.marketCaps[0].marketCap).toBe(3000000000000);
    expect(data.annualFinancials[0]).toMatchObject({
      fiscalYear: 2025,
      revenue: 1000,
      profitBeforeTax: 300,
      profitAfterTax: 250,
      ebita: 280,
      totalDebt: 400,
      totalEquity: 800,
      sharesOutstanding: 100,
      earningsPerShare: 2.5,
      bookValuePerShare: 8,
    });
    expect(data.annualDividends[0]).toMatchObject({
      fiscalYear: 2025,
      dividendPerShare: 1,
      currency: "USD",
    });
  });

  it("returns warnings instead of throwing for missing optional fundamentals", async () => {
    const provider = createYahooFinanceProvider({
      now: () => new Date("2026-05-04T00:00:00.000Z"),
      yahoo: {
        historical: async () => [],
        quote: async () => ({ currency: "USD" }),
        quoteSummary: async () => ({}),
      },
    });

    const data = await provider.fetchStock(row);

    expect(data.warnings).toContain("no_daily_prices");
    expect(data.warnings).toContain("no_annual_financials");
    expect(data.annualFinancials).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the adapter test to verify it fails**

Run:

```powershell
npm test -- src/server/providers/yahooFinanceClient.test.ts
```

Expected: FAIL because `yahooFinanceClient.ts` does not exist.

- [ ] **Step 3: Implement the adapter**

Create `src/server/providers/yahooFinanceClient.ts`:

```ts
import yahooFinance from "yahoo-finance2";
import type {
  MarketDataProvider,
  ProviderAnnualFinancial,
  ProviderStockData,
  ProviderUniverseRow,
} from "./types";

type YahooLikeClient = {
  historical: typeof yahooFinance.historical;
  quote: typeof yahooFinance.quote;
  quoteSummary: typeof yahooFinance.quoteSummary;
};

type YahooProviderDeps = {
  yahoo?: YahooLikeClient;
  now?: () => Date;
};

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fiscalYearFromEndDate(value: unknown): number | null {
  if (!(value instanceof Date)) return null;
  return value.getUTCFullYear();
}

function mapAnnualFinancials(summary: any): ProviderAnnualFinancial[] {
  const income = summary.incomeStatementHistory?.incomeStatementHistory?.[0];
  const balance = summary.balanceSheetHistory?.balanceSheetStatements?.[0];
  const fiscalYear = fiscalYearFromEndDate(income?.endDate ?? balance?.endDate);

  if (!fiscalYear) return [];

  return [
    {
      fiscalYear,
      revenue: asNumber(income?.totalRevenue),
      profitBeforeTax: asNumber(income?.pretaxIncome),
      profitAfterTax: asNumber(income?.netIncome),
      ebita: asNumber(income?.ebit),
      totalDebt: asNumber(balance?.totalDebt),
      totalEquity: asNumber(balance?.totalStockholderEquity),
      sharesOutstanding: asNumber(summary.defaultKeyStatistics?.sharesOutstanding),
      earningsPerShare: asNumber(summary.defaultKeyStatistics?.trailingEps),
      bookValuePerShare: asNumber(summary.defaultKeyStatistics?.bookValue),
    },
  ];
}

export function createYahooFinanceProvider(
  deps: YahooProviderDeps = {},
): MarketDataProvider {
  const yahoo = deps.yahoo ?? yahooFinance;
  const now = deps.now ?? (() => new Date());

  return {
    source: "yahoo_finance",
    async fetchStock(row: ProviderUniverseRow): Promise<ProviderStockData> {
      const period1 = new Date(Date.UTC(now().getUTCFullYear() - 1, 0, 1));
      const warnings: string[] = [];

      const [historical, quote, summary] = await Promise.all([
        yahoo.historical(row.providerSymbol, {
          period1,
          interval: "1d",
        }),
        yahoo.quote(row.providerSymbol),
        yahoo.quoteSummary(row.providerSymbol, {
          modules: [
            "incomeStatementHistory",
            "balanceSheetHistory",
            "defaultKeyStatistics",
            "summaryDetail",
          ],
        }),
      ]);

      const dailyPrices = historical
        .filter((item: any) => item.date && item.open && item.high && item.low && item.close)
        .map((item: any) => ({
          date: item.date,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
          adjustedClose: asNumber(item.adjClose),
          volume: asNumber(item.volume),
        }));

      if (dailyPrices.length === 0) warnings.push("no_daily_prices");

      const annualFinancials = mapAnnualFinancials(summary);
      if (annualFinancials.length === 0) warnings.push("no_annual_financials");

      const dividendRate = asNumber((summary as any).summaryDetail?.dividendRate);
      const latestFiscalYear = annualFinancials[0]?.fiscalYear ?? now().getUTCFullYear();
      const annualDividends =
        dividendRate === null
          ? []
          : [
              {
                fiscalYear: latestFiscalYear,
                dividendPerShare: dividendRate,
                currency: quote.currency ?? row.currency,
              },
            ];

      const marketCap = asNumber((quote as any).marketCap);
      const marketCaps =
        marketCap === null
          ? []
          : [
              {
                date: now(),
                marketCap,
                currency: quote.currency ?? row.currency,
                calculationMethod: "provider_reported",
              },
            ];

      return {
        row,
        dailyPrices,
        annualFinancials,
        annualDividends,
        marketCaps,
        warnings,
      };
    },
  };
}
```

- [ ] **Step 4: Run the adapter test**

Run:

```powershell
npm test -- src/server/providers/yahooFinanceClient.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/server/providers/yahooFinanceClient.ts src/server/providers/yahooFinanceClient.test.ts
git commit -m "feat: add yahoo finance provider adapter"
```

---

### Task 4: Provider Import Service

**Files:**
- Create: `src/server/import/providerImport.ts`
- Create: `src/server/import/providerImport.test.ts`

- [ ] **Step 1: Write the failing import tests**

Create `src/server/import/providerImport.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { prisma } from "../db";
import type { MarketDataProvider, ProviderUniverseRow } from "../providers/types";
import { importProviderUniverse } from "./providerImport";

const row: ProviderUniverseRow = {
  marketCode: "SGX",
  exchange: "SGX",
  stockCode: "D05",
  stockName: "DBS Group Holdings",
  currency: "SGD",
  providerSymbol: "D05.SI",
};

describe("importProviderUniverse", () => {
  it("normalizes provider data into raw fact tables", async () => {
    const provider: MarketDataProvider = {
      source: "fake_provider",
      async fetchStock(input) {
        return {
          row: input,
          dailyPrices: [
            {
              date: new Date("2026-05-01T00:00:00.000Z"),
              open: 10,
              high: 11,
              low: 9,
              close: 10.5,
              adjustedClose: 10.4,
              volume: 1000,
            },
          ],
          annualFinancials: [
            {
              fiscalYear: 2025,
              revenue: 100,
              profitBeforeTax: 20,
              profitAfterTax: 15,
              ebita: 18,
              totalDebt: 40,
              totalEquity: 80,
              sharesOutstanding: 1000,
              earningsPerShare: 0.15,
              bookValuePerShare: 0.8,
            },
          ],
          annualDividends: [
            {
              fiscalYear: 2025,
              dividendPerShare: 0.06,
              currency: "SGD",
            },
          ],
          marketCaps: [
            {
              date: new Date("2026-05-01T00:00:00.000Z"),
              marketCap: 10500,
              currency: "SGD",
              calculationMethod: "provider_reported",
            },
          ],
          warnings: [],
        };
      },
    };

    const summary = await importProviderUniverse({
      provider,
      rows: [row],
      now: new Date("2026-05-04T00:00:00.000Z"),
    });

    expect(summary).toEqual({
      source: "fake_provider",
      attempted: 1,
      imported: 1,
      partial: 0,
      failed: 0,
    });

    const stock = await prisma.stock.findFirstOrThrow({
      where: { stockCode: "D05" },
      include: {
        market: true,
        dailyPrices: true,
        financials: true,
        dividends: true,
        marketCaps: true,
      },
    });

    expect(stock.market.code).toBe("SGX");
    expect(stock.providerSymbol).toBe("D05.SI");
    expect(stock.dailyPrices).toHaveLength(1);
    expect(stock.financials).toHaveLength(1);
    expect(stock.dividends).toHaveLength(1);
    expect(stock.marketCaps).toHaveLength(1);
  });

  it("records partial imports and continues when provider returns warnings", async () => {
    const provider: MarketDataProvider = {
      source: "fake_provider",
      async fetchStock(input) {
        return {
          row: input,
          dailyPrices: [],
          annualFinancials: [],
          annualDividends: [],
          marketCaps: [],
          warnings: ["no_daily_prices", "no_annual_financials"],
        };
      },
    };

    const summary = await importProviderUniverse({
      provider,
      rows: [row],
      now: new Date("2026-05-04T00:00:00.000Z"),
    });

    expect(summary.partial).toBe(1);

    const importRun = await prisma.importRun.findFirstOrThrow({
      where: { source: "fake_provider" },
      orderBy: { id: "desc" },
    });

    expect(importRun.status).toBe("partial");
    expect(importRun.message).toContain("D05: no_daily_prices, no_annual_financials");
  });
});
```

- [ ] **Step 2: Run the import tests to verify they fail**

Run:

```powershell
npm test -- src/server/import/providerImport.test.ts
```

Expected: FAIL because `providerImport.ts` does not exist.

- [ ] **Step 3: Implement the provider import service**

Create `src/server/import/providerImport.ts`:

```ts
import { prisma } from "../db";
import type { MarketDataProvider, ProviderStockData, ProviderUniverseRow } from "../providers/types";

export type ProviderImportSummary = {
  source: string;
  attempted: number;
  imported: number;
  partial: number;
  failed: number;
};

type ImportProviderUniverseInput = {
  provider: MarketDataProvider;
  rows: ProviderUniverseRow[];
  now?: Date;
};

function marketDefaults(row: ProviderUniverseRow) {
  if (row.marketCode === "SGX") {
    return {
      name: "Singapore Exchange",
      country: "Singapore",
      timezone: "Asia/Singapore",
    };
  }

  return {
    name: "United States",
    country: "United States",
    timezone: "America/New_York",
  };
}

async function upsertStock(row: ProviderUniverseRow) {
  const defaults = marketDefaults(row);
  const market = await prisma.market.upsert({
    where: { code: row.marketCode },
    update: {
      name: defaults.name,
      country: defaults.country,
      currency: row.currency,
      timezone: defaults.timezone,
      status: "active",
    },
    create: {
      code: row.marketCode,
      name: defaults.name,
      country: defaults.country,
      currency: row.currency,
      timezone: defaults.timezone,
      status: "active",
    },
  });

  return prisma.stock.upsert({
    where: {
      marketId_stockCode: {
        marketId: market.id,
        stockCode: row.stockCode,
      },
    },
    update: {
      exchange: row.exchange,
      stockName: row.stockName,
      currency: row.currency,
      providerSymbol: row.providerSymbol,
      isActive: true,
    },
    create: {
      marketId: market.id,
      exchange: row.exchange,
      stockCode: row.stockCode,
      stockName: row.stockName,
      currency: row.currency,
      providerSymbol: row.providerSymbol,
      isActive: true,
    },
  });
}

async function writeProviderData(data: ProviderStockData, source: string, fetchedAt: Date) {
  const stock = await upsertStock(data.row);

  for (const price of data.dailyPrices) {
    await prisma.dailyPrice.upsert({
      where: {
        stockId_date: {
          stockId: stock.id,
          date: price.date,
        },
      },
      update: {
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        adjustedClose: price.adjustedClose,
        volume: price.volume,
        source,
        fetchedAt,
      },
      create: {
        stockId: stock.id,
        date: price.date,
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        adjustedClose: price.adjustedClose,
        volume: price.volume,
        source,
        fetchedAt,
      },
    });
  }

  for (const financial of data.annualFinancials) {
    await prisma.annualFinancial.upsert({
      where: {
        stockId_fiscalYear: {
          stockId: stock.id,
          fiscalYear: financial.fiscalYear,
        },
      },
      update: { ...financial, source, fetchedAt },
      create: { stockId: stock.id, ...financial, source, fetchedAt },
    });
  }

  for (const dividend of data.annualDividends) {
    await prisma.annualDividend.upsert({
      where: {
        stockId_fiscalYear: {
          stockId: stock.id,
          fiscalYear: dividend.fiscalYear,
        },
      },
      update: { ...dividend, source, fetchedAt },
      create: { stockId: stock.id, ...dividend, source, fetchedAt },
    });
  }

  for (const cap of data.marketCaps) {
    await prisma.marketCap.upsert({
      where: {
        stockId_date_source: {
          stockId: stock.id,
          date: cap.date,
          source,
        },
      },
      update: { ...cap, source, fetchedAt },
      create: { stockId: stock.id, ...cap, source, fetchedAt },
    });
  }
}

export async function importProviderUniverse(
  input: ImportProviderUniverseInput,
): Promise<ProviderImportSummary> {
  const now = input.now ?? new Date();
  const messages: string[] = [];
  let imported = 0;
  let partial = 0;
  let failed = 0;

  for (const row of input.rows) {
    try {
      const data = await input.provider.fetchStock(row);
      await writeProviderData(data, input.provider.source, now);

      if (data.warnings.length > 0) {
        partial += 1;
        messages.push(`${row.stockCode}: ${data.warnings.join(", ")}`);
      } else {
        imported += 1;
      }
    } catch (error) {
      failed += 1;
      messages.push(
        `${row.stockCode}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const status = failed > 0 || partial > 0 ? "partial" : "completed";

  await prisma.importRun.create({
    data: {
      source: input.provider.source,
      importType: "provider_universe",
      status,
      startedAt: now,
      completedAt: now,
      message: messages.length === 0 ? "Provider import completed." : messages.join("; "),
    },
  });

  return {
    source: input.provider.source,
    attempted: input.rows.length,
    imported,
    partial,
    failed,
  };
}
```

- [ ] **Step 4: Run the import tests**

Run:

```powershell
npm test -- src/server/import/providerImport.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/server/import/providerImport.ts src/server/import/providerImport.test.ts
git commit -m "feat: import provider data into local store"
```

---

### Task 5: CLI Runner

**Files:**
- Create: `src/server/import/runYahooFinanceImport.ts`

- [ ] **Step 1: Create the CLI runner**

Create `src/server/import/runYahooFinanceImport.ts`:

```ts
import { join } from "node:path";
import { prisma } from "../db";
import { importProviderUniverse } from "./providerImport";
import { readProviderUniverseFiles } from "../providers/providerUniverse";
import { createYahooFinanceProvider } from "../providers/yahooFinanceClient";

async function main() {
  const universeFiles = [
    join(process.cwd(), "data", "provider-universe", "us.csv"),
    join(process.cwd(), "data", "provider-universe", "sg.csv"),
  ];

  const rows = await readProviderUniverseFiles(universeFiles);
  const provider = createYahooFinanceProvider();
  const summary = await importProviderUniverse({ provider, rows });

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Type-check through build**

Run:

```powershell
npm run build
```

Expected: build succeeds. If `yahoo-finance2` type signatures differ from the adapter assumptions, update `YahooLikeClient` in `src/server/providers/yahooFinanceClient.ts` to use a narrower local interface with `historical`, `quote`, and `quoteSummary` method signatures used by this app.

- [ ] **Step 3: Run unit tests**

Run:

```powershell
npm test
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/server/import/runYahooFinanceImport.ts
git commit -m "feat: add yahoo finance import runner"
```

---

### Task 6: Docs And Manual Workflow

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README data notes**

Modify the README setup or data section to include:

```md
## Yahoo Finance Prototype Import

For personal/internal research prototypes, the app can import a small curated
US and SGX universe from Yahoo Finance through the server-side
`yahoo-finance2` adapter.

```powershell
npm run import:yahoo
npm run metrics:recompute
```

The curated provider symbols live in:

- `data/provider-universe/us.csv`
- `data/provider-universe/sg.csv`

This source is unofficial and should not be treated as suitable for public data
redistribution. Keep CSV import available for missing or corrected SGX
fundamentals.
```

- [ ] **Step 2: Run README-safe verification**

Run:

```powershell
npm test
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```powershell
git add README.md
git commit -m "docs: document yahoo finance prototype import"
```

---

### Task 7: Live Smoke Test And Final Verification

**Files:**
- No planned source edits unless the live provider reveals a mapping issue.

- [ ] **Step 1: Run the live Yahoo import**

Run:

```powershell
npm run import:yahoo
```

Expected: JSON summary similar to:

```json
{
  "source": "yahoo_finance",
  "attempted": 6,
  "imported": 3,
  "partial": 3,
  "failed": 0
}
```

Partial SGX imports are acceptable if fundamentals are missing. Request failures should be investigated before finishing.

- [ ] **Step 2: Recompute metrics**

Run:

```powershell
npm run metrics:recompute
```

Expected: JSON summary with `stocksProcessed` greater than or equal to `6` and `metricsWritten` greater than `0`.

- [ ] **Step 3: Run full verification**

Run:

```powershell
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 4: Inspect working tree**

Run:

```powershell
git status --short
```

Expected: only intentional uncommitted files remain. Do not revert unrelated user changes such as existing local PDFs, notes, generated files, or logs.

- [ ] **Step 5: Final commit if smoke-test fixes were needed**

If live smoke testing required source changes, commit only those changes:

```powershell
git add <changed-files>
git commit -m "fix: harden yahoo finance import smoke test"
```

If no source changes were needed, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Personal/internal free source direction: covered by Yahoo Finance adapter and README caveat tasks.
- CSV fallback: preserved by leaving existing fixture/CSV import unchanged and documenting correction path.
- Local data-hub architecture: covered by provider import service writing Prisma raw fact tables.
- Curated provider universe: covered by `data/provider-universe/*.csv` and parser tests.
- Missing data handling: covered by provider warnings and partial import tests.
- Testing expectations: covered by parser tests, adapter tests, provider import tests, full test run, build, and live smoke test.

No placeholders remain in the plan. Function names and types are consistent across tasks.
