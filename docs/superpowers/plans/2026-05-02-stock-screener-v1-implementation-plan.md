# Stock Screener V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a V1 end-of-day stock screener for US and Singapore stocks with local cached data, deterministic sample data, formula-based metrics, filterable results, missing-data indicators, and CSV export.

**Architecture:** Use a Next.js App Router application with a server-side SQLite data hub. Provider and CSV imports populate normalized database tables, a metric layer calculates derived values, API routes expose screening and export behavior, and the frontend renders a practical screener workspace.

**Tech Stack:** Next.js, TypeScript, React, Prisma, SQLite, Zod, csv-parse, Vitest, Testing Library, Playwright.

---

## Source Specs

Read these before implementation:

- `docs/superpowers/specs/2026-05-02-stock-screener-product-scope-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-architecture-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-data-model-formulas-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-data-flow-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-error-handling-testing-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-data-sourcing-logistics-risks.md`

## File Structure

Create or modify these files:

- `package.json`: npm scripts and dependencies.
- `tsconfig.json`: TypeScript configuration.
- `next.config.ts`: Next.js configuration.
- `vitest.config.ts`: unit and component test configuration.
- `playwright.config.ts`: browser smoke test configuration.
- `prisma/schema.prisma`: SQLite schema for markets, stocks, prices, financials, dividends, market caps, metrics, imports, and screen runs.
- `prisma/seed.ts`: deterministic fixture import.
- `data/fixtures/markets.csv`: US and SGX market rows.
- `data/fixtures/stocks.csv`: sample stock universe.
- `data/fixtures/daily_prices.csv`: recent OHLC fixture rows.
- `data/fixtures/annual_financials.csv`: two-year fundamentals.
- `data/fixtures/annual_dividends.csv`: two-year dividends.
- `src/domain/types.ts`: domain types shared by formula and screener services.
- `src/domain/metrics.ts`: formula implementation.
- `src/domain/metrics.test.ts`: formula tests.
- `src/domain/filtering.ts`: filter validation helpers.
- `src/domain/filtering.test.ts`: filter validation tests.
- `src/server/db.ts`: Prisma client singleton.
- `src/server/csv/readCsv.ts`: CSV reader helper.
- `src/server/import/fixtureImport.ts`: fixture import logic.
- `src/server/import/fixtureImport.test.ts`: fixture import tests.
- `src/server/metrics/recomputeMetrics.ts`: derived metric recomputation.
- `src/server/metrics/recomputeMetrics.test.ts`: recompute tests.
- `src/server/screener/screenerService.ts`: screen query service.
- `src/server/screener/screenerService.test.ts`: screener tests.
- `src/server/export/csvExport.ts`: CSV export builder.
- `src/server/export/csvExport.test.ts`: export tests.
- `src/app/api/screen/route.ts`: screen API route.
- `src/app/api/export/route.ts`: CSV export API route.
- `src/app/layout.tsx`: app layout.
- `src/app/page.tsx`: screener page.
- `src/app/globals.css`: base styling.
- `src/components/MarketSelector.tsx`: market controls.
- `src/components/FilterBuilder.tsx`: metric range controls.
- `src/components/CriteriaSummary.tsx`: selected criteria summary.
- `src/components/ResultsTable.tsx`: results table.
- `src/components/DataQualityBadge.tsx`: data quality badges.
- `src/components/ExportButton.tsx`: CSV export trigger.
- `src/app/page.test.tsx`: frontend component smoke tests.
- `tests/e2e/screener.spec.ts`: Playwright smoke flow.
- `README.md`: project setup, test, and run instructions.

## Task 1: Project Scaffold

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create package scripts and dependencies**

Create `package.json`:

```json
{
  "name": "stock-screener",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "import:fixtures": "tsx src/server/import/runFixtureImport.ts",
    "metrics:recompute": "tsx src/server/metrics/runRecomputeMetrics.ts"
  },
  "dependencies": {
    "@prisma/client": "latest",
    "csv-parse": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "jsdom": "latest",
    "prisma": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```powershell
npm install
```

Expected: `node_modules` is created and `package-lock.json` is written.

- [ ] **Step 3: Create TypeScript configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create Next.js config**

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 5: Create Vitest config**

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 6: Create Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 7: Create test setup**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 8: Create minimal app shell**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Screener",
  description: "End-of-day stock screening for research candidates.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="app-shell">
      <h1>Stock Screener</h1>
      <p>Filter end-of-day stock data for research candidates.</p>
    </main>
  );
}
```

Create `src/app/globals.css`:

```css
:root {
  color-scheme: light;
  --background: #f6f7f9;
  --foreground: #18202a;
  --muted: #64748b;
  --border: #d8dee8;
  --panel: #ffffff;
  --accent: #2563eb;
  --danger: #b42318;
  --warning: #8a4b00;
  --success: #047857;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--background);
  color: var(--foreground);
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px;
}
```

- [ ] **Step 9: Verify scaffold builds enough to fail only on missing generated Next files**

Run:

```powershell
npm test
```

Expected: PASS with no tests found only if Vitest reports no matching test files. After `src/test/setup.ts` exists, Vitest should start without TypeScript errors.

- [ ] **Step 10: Commit scaffold**

Run:

```powershell
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts playwright.config.ts src/app/layout.tsx src/app/page.tsx src/app/globals.css src/test/setup.ts
git commit -m "chore: scaffold stock screener app"
```

## Task 2: Domain Types And Formula Tests

**Files:**

- Create: `src/domain/types.ts`
- Create: `src/domain/metrics.ts`
- Create: `src/domain/metrics.test.ts`

- [ ] **Step 1: Write failing formula tests**

Create `src/domain/metrics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  calculateDebtToEquity,
  calculateDividendGrowthRate,
  calculateDividendYield,
  calculateMarketCap,
  calculatePbRatio,
  calculatePeRatio,
  calculateProfitGrowthRate,
  calculateRevenueGrowthRate,
} from "./metrics";

describe("metric formulas", () => {
  it("calculates market cap from close price and shares outstanding", () => {
    expect(calculateMarketCap({ closePrice: 10, sharesOutstanding: 1_000_000 })).toEqual({
      status: "complete",
      value: 10_000_000,
    });
  });

  it("marks market cap unavailable when shares are missing", () => {
    expect(calculateMarketCap({ closePrice: 10, sharesOutstanding: null })).toEqual({
      status: "missing",
      reason: "shares_outstanding_missing",
    });
  });

  it("calculates revenue growth", () => {
    expect(calculateRevenueGrowthRate({ latestRevenue: 125, priorRevenue: 100 })).toEqual({
      status: "complete",
      value: 0.25,
    });
  });

  it("marks revenue growth unavailable for zero prior revenue", () => {
    expect(calculateRevenueGrowthRate({ latestRevenue: 125, priorRevenue: 0 })).toEqual({
      status: "unavailable",
      reason: "prior_revenue_not_positive",
    });
  });

  it("calculates profit growth using profit after tax", () => {
    expect(calculateProfitGrowthRate({ latestProfitAfterTax: 90, priorProfitAfterTax: 60 })).toEqual({
      status: "complete",
      value: 0.5,
    });
  });

  it("calculates dividend yield", () => {
    expect(calculateDividendYield({ dividendPerShare: 0.5, closePrice: 20 })).toEqual({
      status: "complete",
      value: 0.025,
    });
  });

  it("allows confirmed zero dividends to produce zero dividend yield", () => {
    expect(calculateDividendYield({ dividendPerShare: 0, closePrice: 20 })).toEqual({
      status: "complete",
      value: 0,
    });
  });

  it("calculates dividend growth", () => {
    expect(calculateDividendGrowthRate({ latestDividend: 0.6, priorDividend: 0.5 })).toEqual({
      status: "complete",
      value: 0.2,
    });
  });

  it("marks dividend growth unavailable when prior dividend is zero", () => {
    expect(calculateDividendGrowthRate({ latestDividend: 0.6, priorDividend: 0 })).toEqual({
      status: "unavailable",
      reason: "prior_dividend_not_positive",
    });
  });

  it("calculates P/E", () => {
    expect(calculatePeRatio({ closePrice: 30, earningsPerShare: 3 })).toEqual({
      status: "complete",
      value: 10,
    });
  });

  it("marks P/E unavailable for negative earnings", () => {
    expect(calculatePeRatio({ closePrice: 30, earningsPerShare: -1 })).toEqual({
      status: "unavailable",
      reason: "earnings_per_share_not_positive",
    });
  });

  it("calculates P/B", () => {
    expect(calculatePbRatio({ closePrice: 25, bookValuePerShare: 10 })).toEqual({
      status: "complete",
      value: 2.5,
    });
  });

  it("calculates debt to equity", () => {
    expect(calculateDebtToEquity({ totalDebt: 40, totalEquity: 100 })).toEqual({
      status: "complete",
      value: 0.4,
    });
  });
});
```

- [ ] **Step 2: Run formula tests and verify failure**

Run:

```powershell
npm test -- src/domain/metrics.test.ts
```

Expected: FAIL because `src/domain/metrics.ts` does not exist.

- [ ] **Step 3: Create domain types**

Create `src/domain/types.ts`:

```ts
export type DataQualityStatus = "complete" | "fresh" | "stale" | "missing" | "unavailable" | "csv";

export type MetricSuccess = {
  status: "complete";
  value: number;
};

export type MetricFailure = {
  status: "missing" | "unavailable";
  reason: string;
};

export type MetricResult = MetricSuccess | MetricFailure;

export type MetricKey =
  | "market_cap"
  | "revenue_growth_rate"
  | "profit_growth_rate"
  | "dividend_yield"
  | "dividend_growth_rate"
  | "pe_ratio"
  | "pb_ratio"
  | "debt_to_equity_ratio"
  | "open"
  | "high"
  | "low"
  | "close";

export type RangeFilter = {
  metricKey: MetricKey;
  min: number | null;
  max: number | null;
};
```

- [ ] **Step 4: Implement formulas**

Create `src/domain/metrics.ts`:

```ts
import type { MetricResult } from "./types";

function missing(reason: string): MetricResult {
  return { status: "missing", reason };
}

function unavailable(reason: string): MetricResult {
  return { status: "unavailable", reason };
}

function complete(value: number): MetricResult {
  if (!Number.isFinite(value)) {
    return unavailable("metric_not_finite");
  }
  return { status: "complete", value };
}

function requireNumber(value: number | null | undefined, reason: string): MetricResult | number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return missing(reason);
  }
  return value;
}

export function calculateMarketCap(input: {
  closePrice: number | null | undefined;
  sharesOutstanding: number | null | undefined;
}): MetricResult {
  const closePrice = requireNumber(input.closePrice, "close_price_missing");
  if (typeof closePrice !== "number") return closePrice;
  const sharesOutstanding = requireNumber(input.sharesOutstanding, "shares_outstanding_missing");
  if (typeof sharesOutstanding !== "number") return sharesOutstanding;
  if (closePrice < 0) return unavailable("close_price_negative");
  if (sharesOutstanding <= 0) return unavailable("shares_outstanding_not_positive");
  return complete(closePrice * sharesOutstanding);
}

export function calculateRevenueGrowthRate(input: {
  latestRevenue: number | null | undefined;
  priorRevenue: number | null | undefined;
}): MetricResult {
  const latestRevenue = requireNumber(input.latestRevenue, "latest_revenue_missing");
  if (typeof latestRevenue !== "number") return latestRevenue;
  const priorRevenue = requireNumber(input.priorRevenue, "prior_revenue_missing");
  if (typeof priorRevenue !== "number") return priorRevenue;
  if (priorRevenue <= 0) return unavailable("prior_revenue_not_positive");
  return complete((latestRevenue - priorRevenue) / priorRevenue);
}

export function calculateProfitGrowthRate(input: {
  latestProfitAfterTax: number | null | undefined;
  priorProfitAfterTax: number | null | undefined;
}): MetricResult {
  const latestProfit = requireNumber(input.latestProfitAfterTax, "latest_profit_after_tax_missing");
  if (typeof latestProfit !== "number") return latestProfit;
  const priorProfit = requireNumber(input.priorProfitAfterTax, "prior_profit_after_tax_missing");
  if (typeof priorProfit !== "number") return priorProfit;
  if (priorProfit <= 0) return unavailable("prior_profit_after_tax_not_positive");
  return complete((latestProfit - priorProfit) / priorProfit);
}

export function calculateDividendYield(input: {
  dividendPerShare: number | null | undefined;
  closePrice: number | null | undefined;
}): MetricResult {
  const dividend = requireNumber(input.dividendPerShare, "dividend_per_share_missing");
  if (typeof dividend !== "number") return dividend;
  const closePrice = requireNumber(input.closePrice, "close_price_missing");
  if (typeof closePrice !== "number") return closePrice;
  if (dividend < 0) return unavailable("dividend_per_share_negative");
  if (closePrice <= 0) return unavailable("close_price_not_positive");
  return complete(dividend / closePrice);
}

export function calculateDividendGrowthRate(input: {
  latestDividend: number | null | undefined;
  priorDividend: number | null | undefined;
}): MetricResult {
  const latestDividend = requireNumber(input.latestDividend, "latest_dividend_missing");
  if (typeof latestDividend !== "number") return latestDividend;
  const priorDividend = requireNumber(input.priorDividend, "prior_dividend_missing");
  if (typeof priorDividend !== "number") return priorDividend;
  if (priorDividend <= 0) return unavailable("prior_dividend_not_positive");
  return complete((latestDividend - priorDividend) / priorDividend);
}

export function calculatePeRatio(input: {
  closePrice: number | null | undefined;
  earningsPerShare: number | null | undefined;
}): MetricResult {
  const closePrice = requireNumber(input.closePrice, "close_price_missing");
  if (typeof closePrice !== "number") return closePrice;
  const earningsPerShare = requireNumber(input.earningsPerShare, "earnings_per_share_missing");
  if (typeof earningsPerShare !== "number") return earningsPerShare;
  if (closePrice <= 0) return unavailable("close_price_not_positive");
  if (earningsPerShare <= 0) return unavailable("earnings_per_share_not_positive");
  return complete(closePrice / earningsPerShare);
}

export function calculatePbRatio(input: {
  closePrice: number | null | undefined;
  bookValuePerShare: number | null | undefined;
}): MetricResult {
  const closePrice = requireNumber(input.closePrice, "close_price_missing");
  if (typeof closePrice !== "number") return closePrice;
  const bookValuePerShare = requireNumber(input.bookValuePerShare, "book_value_per_share_missing");
  if (typeof bookValuePerShare !== "number") return bookValuePerShare;
  if (closePrice <= 0) return unavailable("close_price_not_positive");
  if (bookValuePerShare <= 0) return unavailable("book_value_per_share_not_positive");
  return complete(closePrice / bookValuePerShare);
}

export function calculateDebtToEquity(input: {
  totalDebt: number | null | undefined;
  totalEquity: number | null | undefined;
}): MetricResult {
  const totalDebt = requireNumber(input.totalDebt, "total_debt_missing");
  if (typeof totalDebt !== "number") return totalDebt;
  const totalEquity = requireNumber(input.totalEquity, "total_equity_missing");
  if (typeof totalEquity !== "number") return totalEquity;
  if (totalDebt < 0) return unavailable("total_debt_negative");
  if (totalEquity <= 0) return unavailable("total_equity_not_positive");
  return complete(totalDebt / totalEquity);
}
```

- [ ] **Step 5: Run formula tests**

Run:

```powershell
npm test -- src/domain/metrics.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit formulas**

Run:

```powershell
git add src/domain/types.ts src/domain/metrics.ts src/domain/metrics.test.ts
git commit -m "feat: add stock metric formulas"
```

## Task 3: Filter Validation

**Files:**

- Create: `src/domain/filtering.ts`
- Create: `src/domain/filtering.test.ts`

- [ ] **Step 1: Write failing filter tests**

Create `src/domain/filtering.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateRangeFilters } from "./filtering";

describe("validateRangeFilters", () => {
  it("accepts valid min and max filters", () => {
    expect(
      validateRangeFilters([
        { metricKey: "pe_ratio", min: 5, max: 20 },
        { metricKey: "dividend_yield", min: 0.02, max: null },
      ]),
    ).toEqual({
      ok: true,
      filters: [
        { metricKey: "pe_ratio", min: 5, max: 20 },
        { metricKey: "dividend_yield", min: 0.02, max: null },
      ],
    });
  });

  it("rejects unknown metric keys", () => {
    expect(validateRangeFilters([{ metricKey: "unknown", min: 1, max: 2 }])).toEqual({
      ok: false,
      errors: [{ field: "filters.0.metricKey", message: "Unsupported metric key." }],
    });
  });

  it("rejects max lower than min", () => {
    expect(validateRangeFilters([{ metricKey: "pe_ratio", min: 20, max: 5 }])).toEqual({
      ok: false,
      errors: [{ field: "filters.0.max", message: "Maximum must be greater than or equal to minimum." }],
    });
  });
});
```

- [ ] **Step 2: Run filter tests and verify failure**

Run:

```powershell
npm test -- src/domain/filtering.test.ts
```

Expected: FAIL because `src/domain/filtering.ts` does not exist.

- [ ] **Step 3: Implement filter validation**

Create `src/domain/filtering.ts`:

```ts
import { z } from "zod";
import type { MetricKey, RangeFilter } from "./types";

export const metricKeys = [
  "market_cap",
  "revenue_growth_rate",
  "profit_growth_rate",
  "dividend_yield",
  "dividend_growth_rate",
  "pe_ratio",
  "pb_ratio",
  "debt_to_equity_ratio",
  "open",
  "high",
  "low",
  "close",
] as const satisfies readonly MetricKey[];

const rangeFilterSchema = z.object({
  metricKey: z.enum(metricKeys),
  min: z.number().finite().nullable(),
  max: z.number().finite().nullable(),
});

export type ValidationError = {
  field: string;
  message: string;
};

export type FilterValidationResult =
  | { ok: true; filters: RangeFilter[] }
  | { ok: false; errors: ValidationError[] };

export function validateRangeFilters(input: unknown): FilterValidationResult {
  if (!Array.isArray(input)) {
    return { ok: false, errors: [{ field: "filters", message: "Filters must be an array." }] };
  }

  const errors: ValidationError[] = [];
  const filters: RangeFilter[] = [];

  input.forEach((item, index) => {
    const parsed = rangeFilterSchema.safeParse(item);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      errors.push({
        field: `filters.${index}.${String(issue.path[0] ?? "value")}`,
        message: issue.path[0] === "metricKey" ? "Unsupported metric key." : issue.message,
      });
      return;
    }

    if (parsed.data.min !== null && parsed.data.max !== null && parsed.data.max < parsed.data.min) {
      errors.push({
        field: `filters.${index}.max`,
        message: "Maximum must be greater than or equal to minimum.",
      });
      return;
    }

    filters.push(parsed.data);
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, filters };
}
```

- [ ] **Step 4: Run filter tests**

Run:

```powershell
npm test -- src/domain/filtering.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit filter validation**

Run:

```powershell
git add src/domain/filtering.ts src/domain/filtering.test.ts
git commit -m "feat: validate screener filters"
```

## Task 4: Prisma Schema

**Files:**

- Create: `prisma/schema.prisma`
- Create: `.env.example`

- [ ] **Step 1: Create environment example**

Create `.env.example`:

```env
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 2: Create Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Market {
  id       Int     @id @default(autoincrement())
  code     String  @unique
  name     String
  country  String
  currency String
  timezone String
  status   String
  stocks   Stock[]
}

model Stock {
  id             Int              @id @default(autoincrement())
  marketId       Int
  market         Market           @relation(fields: [marketId], references: [id])
  exchange       String
  stockCode      String
  stockName      String
  currency       String
  sector         String?
  industry       String?
  providerSymbol String
  isActive       Boolean          @default(true)
  dailyPrices    DailyPrice[]
  financials     AnnualFinancial[]
  dividends      AnnualDividend[]
  marketCaps     MarketCap[]
  derivedMetrics DerivedMetric[]

  @@unique([marketId, stockCode])
}

model DailyPrice {
  id            Int      @id @default(autoincrement())
  stockId       Int
  stock         Stock    @relation(fields: [stockId], references: [id])
  date          DateTime
  open          Decimal
  high          Decimal
  low           Decimal
  close         Decimal
  adjustedClose Decimal?
  volume        Decimal?
  source        String
  fetchedAt     DateTime

  @@unique([stockId, date])
}

model AnnualFinancial {
  id                 Int      @id @default(autoincrement())
  stockId            Int
  stock              Stock    @relation(fields: [stockId], references: [id])
  fiscalYear         Int
  revenue            Decimal?
  profitBeforeTax    Decimal?
  profitAfterTax     Decimal?
  ebita              Decimal?
  totalDebt          Decimal?
  totalEquity        Decimal?
  sharesOutstanding  Decimal?
  earningsPerShare   Decimal?
  bookValuePerShare  Decimal?
  source             String
  fetchedAt          DateTime

  @@unique([stockId, fiscalYear])
}

model AnnualDividend {
  id               Int      @id @default(autoincrement())
  stockId          Int
  stock            Stock    @relation(fields: [stockId], references: [id])
  fiscalYear       Int
  dividendPerShare Decimal?
  currency         String
  source           String
  fetchedAt        DateTime

  @@unique([stockId, fiscalYear])
}

model MarketCap {
  id                Int      @id @default(autoincrement())
  stockId           Int
  stock             Stock    @relation(fields: [stockId], references: [id])
  date              DateTime
  marketCap         Decimal
  currency          String
  source            String
  calculationMethod String
  fetchedAt         DateTime

  @@unique([stockId, date, source])
}

model DerivedMetric {
  id             Int      @id @default(autoincrement())
  stockId        Int
  stock          Stock    @relation(fields: [stockId], references: [id])
  metricKey      String
  metricDate     DateTime?
  fiscalYear     Int?
  value          Decimal?
  currency       String?
  formulaVersion String
  inputSnapshot  String
  dataQuality    String
  reason         String?

  @@unique([stockId, metricKey, formulaVersion])
}

model ScreenRun {
  id              Int      @id @default(autoincrement())
  createdAt       DateTime @default(now())
  selectedMarkets String
  filtersJson     String
  resultCount     Int
}

model ImportRun {
  id          Int      @id @default(autoincrement())
  source      String
  importType  String
  status      String
  startedAt   DateTime
  completedAt DateTime?
  message     String?
}
```

- [ ] **Step 3: Generate Prisma client**

Run:

```powershell
Copy-Item .env.example .env
npm run db:generate
```

Expected: Prisma client is generated.

- [ ] **Step 4: Create initial migration**

Run:

```powershell
npm run db:migrate -- --name init
```

Expected: SQLite database and Prisma migration are created.

- [ ] **Step 5: Commit database schema**

Run:

```powershell
git add .env.example prisma/schema.prisma prisma/migrations package.json package-lock.json
git commit -m "feat: add stock screener database schema"
```

## Task 5: Fixture Data And Import

**Files:**

- Create: `data/fixtures/markets.csv`
- Create: `data/fixtures/stocks.csv`
- Create: `data/fixtures/daily_prices.csv`
- Create: `data/fixtures/annual_financials.csv`
- Create: `data/fixtures/annual_dividends.csv`
- Create: `src/server/db.ts`
- Create: `src/server/csv/readCsv.ts`
- Create: `src/server/import/fixtureImport.ts`
- Create: `src/server/import/runFixtureImport.ts`
- Create: `src/server/import/fixtureImport.test.ts`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create deterministic fixture CSV files**

Create `data/fixtures/markets.csv`:

```csv
code,name,country,currency,timezone,status
US,United States,United States,USD,America/New_York,active
SGX,Singapore Exchange,Singapore,SGD,Asia/Singapore,active
```

Create `data/fixtures/stocks.csv`:

```csv
marketCode,exchange,stockCode,stockName,currency,sector,industry,providerSymbol,isActive
US,NASDAQ,AAPL,Apple Inc.,USD,Technology,Consumer Electronics,AAPL,true
US,NASDAQ,MSFT,Microsoft Corporation,USD,Technology,Software,MSFT,true
US,NASDAQ,LOSS,Loss Making Sample Inc.,USD,Industrials,Testing,LOSS,true
SGX,SGX,D05,DBS Group Holdings Ltd,SGD,Financials,Banks,D05.SI,true
SGX,SGX,Z74,Singapore Telecommunications Ltd,SGD,Communication Services,Telecom,Z74.SI,true
SGX,SGX,MISS,Missing Fundamentals Sample Ltd,SGD,Industrials,Testing,MISS.SI,true
```

Create `data/fixtures/daily_prices.csv`:

```csv
stockCode,date,open,high,low,close,adjustedClose,volume,source
AAPL,2026-04-30,170,173,169,172,172,1000000,fixture
MSFT,2026-04-30,410,416,408,415,415,900000,fixture
LOSS,2026-04-30,8,8.2,7.8,8,8,50000,fixture
D05,2026-04-30,36,36.8,35.9,36.5,36.5,700000,fixture
Z74,2026-04-30,2.4,2.46,2.39,2.45,2.45,1200000,fixture
MISS,2026-04-30,1.2,1.22,1.18,1.2,1.2,20000,fixture
```

Create `data/fixtures/annual_financials.csv`:

```csv
stockCode,fiscalYear,revenue,profitBeforeTax,profitAfterTax,ebita,totalDebt,totalEquity,sharesOutstanding,earningsPerShare,bookValuePerShare,source
AAPL,2024,390000000000,120000000000,97000000000,125000000000,95000000000,65000000000,15500000000,6.13,4.19,fixture
AAPL,2025,410000000000,126000000000,102000000000,132000000000,90000000000,72000000000,15400000000,6.62,4.68,fixture
MSFT,2024,245000000000,105000000000,88000000000,112000000000,65000000000,120000000000,7430000000,11.84,16.15,fixture
MSFT,2025,270000000000,116000000000,99000000000,123000000000,62000000000,135000000000,7420000000,13.34,18.19,fixture
LOSS,2024,1000000000,50000000,20000000,80000000,300000000,500000000,100000000,0.2,5,fixture
LOSS,2025,900000000,-20000000,-50000000,10000000,320000000,450000000,100000000,-0.5,4.5,fixture
D05,2024,22000000000,12000000000,10500000000,13000000000,85000000000,65000000000,2850000000,3.68,22.8,fixture
D05,2025,24000000000,12800000000,11200000000,13800000000,88000000000,70000000000,2860000000,3.92,24.48,fixture
Z74,2024,14500000000,2800000000,2300000000,4200000000,9500000000,26000000000,16400000000,0.14,1.59,fixture
Z74,2025,15000000000,3100000000,2500000000,4500000000,9200000000,27000000000,16400000000,0.15,1.65,fixture
```

Create `data/fixtures/annual_dividends.csv`:

```csv
stockCode,fiscalYear,dividendPerShare,currency,source
AAPL,2024,0.96,USD,fixture
AAPL,2025,1.00,USD,fixture
MSFT,2024,3.00,USD,fixture
MSFT,2025,3.32,USD,fixture
LOSS,2024,0,USD,fixture
LOSS,2025,0,USD,fixture
D05,2024,2.16,SGD,fixture
D05,2025,2.40,SGD,fixture
Z74,2024,0.15,SGD,fixture
Z74,2025,0.16,SGD,fixture
```

- [ ] **Step 2: Create database client**

Create `src/server/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Create CSV reader**

Create `src/server/csv/readCsv.ts`:

```ts
import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";

export async function readCsv<T extends Record<string, string>>(path: string): Promise<T[]> {
  const content = await readFile(path, "utf8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}
```

- [ ] **Step 4: Write failing import test**

Create `src/server/import/fixtureImport.test.ts`:

```ts
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
```

- [ ] **Step 5: Implement fixture import**

Create `src/server/import/fixtureImport.ts`:

```ts
import { join } from "node:path";
import { prisma } from "@/server/db";
import { readCsv } from "@/server/csv/readCsv";

type ImportSummary = {
  markets: number;
  stocks: number;
  dailyPrices: number;
  annualFinancials: number;
  annualDividends: number;
};

const fixtureDir = join(process.cwd(), "data", "fixtures");

function asNumber(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return parsed;
}

function asBoolean(value: string): boolean {
  return value.toLowerCase() === "true";
}

function asDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function importFixtures(): Promise<ImportSummary> {
  const now = new Date("2026-05-02T00:00:00.000Z");
  const markets = await readCsv<Record<string, string>>(join(fixtureDir, "markets.csv"));
  const stocks = await readCsv<Record<string, string>>(join(fixtureDir, "stocks.csv"));
  const prices = await readCsv<Record<string, string>>(join(fixtureDir, "daily_prices.csv"));
  const financials = await readCsv<Record<string, string>>(join(fixtureDir, "annual_financials.csv"));
  const dividends = await readCsv<Record<string, string>>(join(fixtureDir, "annual_dividends.csv"));

  await prisma.importRun.create({
    data: {
      source: "fixture",
      importType: "full_fixture",
      status: "started",
      startedAt: now,
    },
  });

  for (const row of markets) {
    await prisma.market.upsert({
      where: { code: row.code },
      update: {
        name: row.name,
        country: row.country,
        currency: row.currency,
        timezone: row.timezone,
        status: row.status,
      },
      create: {
        code: row.code,
        name: row.name,
        country: row.country,
        currency: row.currency,
        timezone: row.timezone,
        status: row.status,
      },
    });
  }

  for (const row of stocks) {
    const market = await prisma.market.findUniqueOrThrow({ where: { code: row.marketCode } });
    await prisma.stock.upsert({
      where: { marketId_stockCode: { marketId: market.id, stockCode: row.stockCode } },
      update: {
        exchange: row.exchange,
        stockName: row.stockName,
        currency: row.currency,
        sector: row.sector || null,
        industry: row.industry || null,
        providerSymbol: row.providerSymbol,
        isActive: asBoolean(row.isActive),
      },
      create: {
        marketId: market.id,
        exchange: row.exchange,
        stockCode: row.stockCode,
        stockName: row.stockName,
        currency: row.currency,
        sector: row.sector || null,
        industry: row.industry || null,
        providerSymbol: row.providerSymbol,
        isActive: asBoolean(row.isActive),
      },
    });
  }

  for (const row of prices) {
    const stock = await prisma.stock.findFirstOrThrow({ where: { stockCode: row.stockCode } });
    await prisma.dailyPrice.upsert({
      where: { stockId_date: { stockId: stock.id, date: asDate(row.date) } },
      update: {
        open: asNumber(row.open) ?? 0,
        high: asNumber(row.high) ?? 0,
        low: asNumber(row.low) ?? 0,
        close: asNumber(row.close) ?? 0,
        adjustedClose: asNumber(row.adjustedClose),
        volume: asNumber(row.volume),
        source: row.source,
        fetchedAt: now,
      },
      create: {
        stockId: stock.id,
        date: asDate(row.date),
        open: asNumber(row.open) ?? 0,
        high: asNumber(row.high) ?? 0,
        low: asNumber(row.low) ?? 0,
        close: asNumber(row.close) ?? 0,
        adjustedClose: asNumber(row.adjustedClose),
        volume: asNumber(row.volume),
        source: row.source,
        fetchedAt: now,
      },
    });
  }

  for (const row of financials) {
    const stock = await prisma.stock.findFirstOrThrow({ where: { stockCode: row.stockCode } });
    await prisma.annualFinancial.upsert({
      where: { stockId_fiscalYear: { stockId: stock.id, fiscalYear: Number(row.fiscalYear) } },
      update: {
        revenue: asNumber(row.revenue),
        profitBeforeTax: asNumber(row.profitBeforeTax),
        profitAfterTax: asNumber(row.profitAfterTax),
        ebita: asNumber(row.ebita),
        totalDebt: asNumber(row.totalDebt),
        totalEquity: asNumber(row.totalEquity),
        sharesOutstanding: asNumber(row.sharesOutstanding),
        earningsPerShare: asNumber(row.earningsPerShare),
        bookValuePerShare: asNumber(row.bookValuePerShare),
        source: row.source,
        fetchedAt: now,
      },
      create: {
        stockId: stock.id,
        fiscalYear: Number(row.fiscalYear),
        revenue: asNumber(row.revenue),
        profitBeforeTax: asNumber(row.profitBeforeTax),
        profitAfterTax: asNumber(row.profitAfterTax),
        ebita: asNumber(row.ebita),
        totalDebt: asNumber(row.totalDebt),
        totalEquity: asNumber(row.totalEquity),
        sharesOutstanding: asNumber(row.sharesOutstanding),
        earningsPerShare: asNumber(row.earningsPerShare),
        bookValuePerShare: asNumber(row.bookValuePerShare),
        source: row.source,
        fetchedAt: now,
      },
    });
  }

  for (const row of dividends) {
    const stock = await prisma.stock.findFirstOrThrow({ where: { stockCode: row.stockCode } });
    await prisma.annualDividend.upsert({
      where: { stockId_fiscalYear: { stockId: stock.id, fiscalYear: Number(row.fiscalYear) } },
      update: {
        dividendPerShare: asNumber(row.dividendPerShare),
        currency: row.currency,
        source: row.source,
        fetchedAt: now,
      },
      create: {
        stockId: stock.id,
        fiscalYear: Number(row.fiscalYear),
        dividendPerShare: asNumber(row.dividendPerShare),
        currency: row.currency,
        source: row.source,
        fetchedAt: now,
      },
    });
  }

  return {
    markets: markets.length,
    stocks: stocks.length,
    dailyPrices: prices.length,
    annualFinancials: financials.length,
    annualDividends: dividends.length,
  };
}
```

- [ ] **Step 6: Create import entrypoints**

Create `src/server/import/runFixtureImport.ts`:

```ts
import { prisma } from "@/server/db";
import { importFixtures } from "./fixtureImport";

importFixtures()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Create `prisma/seed.ts`:

```ts
import { prisma } from "../src/server/db";
import { importFixtures } from "../src/server/import/fixtureImport";

importFixtures()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 7: Run fixture import**

Run:

```powershell
npm run import:fixtures
```

Expected: JSON summary with 2 markets, 6 stocks, 6 daily prices, 10 financial rows, and 10 dividend rows.

- [ ] **Step 8: Run import tests**

Run:

```powershell
npm test -- src/server/import/fixtureImport.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit fixtures and import**

Run:

```powershell
git add data/fixtures src/server/db.ts src/server/csv/readCsv.ts src/server/import prisma/seed.ts
git commit -m "feat: import deterministic stock fixtures"
```

## Task 6: Metric Recompute Service

**Files:**

- Create: `src/server/metrics/recomputeMetrics.ts`
- Create: `src/server/metrics/runRecomputeMetrics.ts`
- Create: `src/server/metrics/recomputeMetrics.test.ts`

- [ ] **Step 1: Write failing recompute test**

Create `src/server/metrics/recomputeMetrics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { importFixtures } from "@/server/import/fixtureImport";
import { recomputeMetrics } from "./recomputeMetrics";

describe("recomputeMetrics", () => {
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
```

- [ ] **Step 2: Run recompute test and verify failure**

Run:

```powershell
npm test -- src/server/metrics/recomputeMetrics.test.ts
```

Expected: FAIL because `recomputeMetrics.ts` does not exist.

- [ ] **Step 3: Implement recompute service**

Create `src/server/metrics/recomputeMetrics.ts`:

```ts
import { prisma } from "@/server/db";
import {
  calculateDebtToEquity,
  calculateDividendGrowthRate,
  calculateDividendYield,
  calculateMarketCap,
  calculatePbRatio,
  calculatePeRatio,
  calculateProfitGrowthRate,
  calculateRevenueGrowthRate,
} from "@/domain/metrics";
import type { MetricResult } from "@/domain/types";

const formulaVersion = "v1";

type RecomputeSummary = {
  stocksProcessed: number;
  metricsWritten: number;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function writeMetric(input: {
  stockId: number;
  metricKey: string;
  metricDate?: Date;
  fiscalYear?: number;
  currency?: string;
  result: MetricResult;
  inputSnapshot: Record<string, unknown>;
}) {
  const value = input.result.status === "complete" ? input.result.value : null;
  const reason = input.result.status === "complete" ? null : input.result.reason;
  const dataQuality = input.result.status;

  await prisma.derivedMetric.upsert({
    where: {
      stockId_metricKey_formulaVersion: {
        stockId: input.stockId,
        metricKey: input.metricKey,
        formulaVersion,
      },
    },
    update: {
      value,
      currency: input.currency ?? null,
      inputSnapshot: JSON.stringify(input.inputSnapshot),
      dataQuality,
      reason,
    },
    create: {
      stockId: input.stockId,
      metricKey: input.metricKey,
      metricDate: input.metricDate ?? null,
      fiscalYear: input.fiscalYear ?? null,
      value,
      currency: input.currency ?? null,
      formulaVersion,
      inputSnapshot: JSON.stringify(input.inputSnapshot),
      dataQuality,
      reason,
    },
  });
}

export async function recomputeMetrics(): Promise<RecomputeSummary> {
  const stocks = await prisma.stock.findMany({
    include: {
      dailyPrices: { orderBy: { date: "desc" }, take: 1 },
      financials: { orderBy: { fiscalYear: "desc" }, take: 2 },
      dividends: { orderBy: { fiscalYear: "desc" }, take: 2 },
    },
  });

  let metricsWritten = 0;

  for (const stock of stocks) {
    const latestPrice = stock.dailyPrices[0];
    const latestFinancial = stock.financials[0];
    const priorFinancial = stock.financials[1];
    const latestDividend = stock.dividends[0];
    const priorDividend = stock.dividends[1];
    const metricDate = latestPrice?.date;
    const fiscalYear = latestFinancial?.fiscalYear;
    const closePrice = toNumber(latestPrice?.close);

    const metricInputs = [
      {
        metricKey: "market_cap",
        result: calculateMarketCap({
          closePrice,
          sharesOutstanding: toNumber(latestFinancial?.sharesOutstanding),
        }),
        currency: stock.currency,
        inputSnapshot: {
          closePrice,
          sharesOutstanding: toNumber(latestFinancial?.sharesOutstanding),
        },
      },
      {
        metricKey: "revenue_growth_rate",
        result: calculateRevenueGrowthRate({
          latestRevenue: toNumber(latestFinancial?.revenue),
          priorRevenue: toNumber(priorFinancial?.revenue),
        }),
        inputSnapshot: {
          latestRevenue: toNumber(latestFinancial?.revenue),
          priorRevenue: toNumber(priorFinancial?.revenue),
        },
      },
      {
        metricKey: "profit_growth_rate",
        result: calculateProfitGrowthRate({
          latestProfitAfterTax: toNumber(latestFinancial?.profitAfterTax),
          priorProfitAfterTax: toNumber(priorFinancial?.profitAfterTax),
        }),
        inputSnapshot: {
          latestProfitAfterTax: toNumber(latestFinancial?.profitAfterTax),
          priorProfitAfterTax: toNumber(priorFinancial?.profitAfterTax),
        },
      },
      {
        metricKey: "dividend_yield",
        result: calculateDividendYield({
          dividendPerShare: toNumber(latestDividend?.dividendPerShare),
          closePrice,
        }),
        inputSnapshot: {
          dividendPerShare: toNumber(latestDividend?.dividendPerShare),
          closePrice,
        },
      },
      {
        metricKey: "dividend_growth_rate",
        result: calculateDividendGrowthRate({
          latestDividend: toNumber(latestDividend?.dividendPerShare),
          priorDividend: toNumber(priorDividend?.dividendPerShare),
        }),
        inputSnapshot: {
          latestDividend: toNumber(latestDividend?.dividendPerShare),
          priorDividend: toNumber(priorDividend?.dividendPerShare),
        },
      },
      {
        metricKey: "pe_ratio",
        result: calculatePeRatio({
          closePrice,
          earningsPerShare: toNumber(latestFinancial?.earningsPerShare),
        }),
        inputSnapshot: {
          closePrice,
          earningsPerShare: toNumber(latestFinancial?.earningsPerShare),
        },
      },
      {
        metricKey: "pb_ratio",
        result: calculatePbRatio({
          closePrice,
          bookValuePerShare: toNumber(latestFinancial?.bookValuePerShare),
        }),
        inputSnapshot: {
          closePrice,
          bookValuePerShare: toNumber(latestFinancial?.bookValuePerShare),
        },
      },
      {
        metricKey: "debt_to_equity_ratio",
        result: calculateDebtToEquity({
          totalDebt: toNumber(latestFinancial?.totalDebt),
          totalEquity: toNumber(latestFinancial?.totalEquity),
        }),
        inputSnapshot: {
          totalDebt: toNumber(latestFinancial?.totalDebt),
          totalEquity: toNumber(latestFinancial?.totalEquity),
        },
      },
    ];

    for (const item of metricInputs) {
      await writeMetric({
        stockId: stock.id,
        metricKey: item.metricKey,
        metricDate,
        fiscalYear,
        currency: item.currency,
        result: item.result,
        inputSnapshot: item.inputSnapshot,
      });
      metricsWritten += 1;
    }

    if (latestPrice) {
      for (const metricKey of ["open", "high", "low", "close"] as const) {
        await writeMetric({
          stockId: stock.id,
          metricKey,
          metricDate,
          currency: stock.currency,
          result: { status: "complete", value: toNumber(latestPrice[metricKey]) ?? 0 },
          inputSnapshot: { [metricKey]: toNumber(latestPrice[metricKey]) },
        });
        metricsWritten += 1;
      }
    }
  }

  return { stocksProcessed: stocks.length, metricsWritten };
}
```

- [ ] **Step 4: Create recompute CLI**

Create `src/server/metrics/runRecomputeMetrics.ts`:

```ts
import { prisma } from "@/server/db";
import { recomputeMetrics } from "./recomputeMetrics";

recomputeMetrics()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 5: Run recompute tests**

Run:

```powershell
npm test -- src/server/metrics/recomputeMetrics.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run recompute CLI**

Run:

```powershell
npm run metrics:recompute
```

Expected: JSON summary with 6 processed stocks and derived metrics written.

- [ ] **Step 7: Commit recompute service**

Run:

```powershell
git add src/server/metrics
git commit -m "feat: compute derived stock metrics"
```

## Task 7: Screener Service

**Files:**

- Create: `src/server/screener/screenerService.ts`
- Create: `src/server/screener/screenerService.test.ts`

- [ ] **Step 1: Write failing screener service tests**

Create `src/server/screener/screenerService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { importFixtures } from "@/server/import/fixtureImport";
import { recomputeMetrics } from "@/server/metrics/recomputeMetrics";
import { runScreen } from "./screenerService";

describe("runScreen", () => {
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
    expect(result.criteria).toEqual([{ metricKey: "pe_ratio", min: 1, max: 40 }]);
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
```

- [ ] **Step 2: Run screener tests and verify failure**

Run:

```powershell
npm test -- src/server/screener/screenerService.test.ts
```

Expected: FAIL because `screenerService.ts` does not exist.

- [ ] **Step 3: Implement screener service**

Create `src/server/screener/screenerService.ts`:

```ts
import { prisma } from "@/server/db";
import { validateRangeFilters } from "@/domain/filtering";
import type { MetricKey, RangeFilter } from "@/domain/types";

type SortInput = {
  metricKey: MetricKey | "stock_code" | "stock_name";
  direction: "asc" | "desc";
};

export type ScreenInput = {
  markets: string[];
  filters: RangeFilter[];
  sort: SortInput;
  page: number;
  pageSize: number;
};

export type ScreenMetricValue = {
  value: number | null;
  dataQuality: string;
  reason: string | null;
  currency: string | null;
};

export type ScreenRow = {
  marketCode: string;
  exchange: string;
  stockCode: string;
  stockName: string;
  currency: string;
  metrics: Record<string, ScreenMetricValue>;
};

export type ScreenResult = {
  criteria: RangeFilter[];
  total: number;
  page: number;
  pageSize: number;
  rows: ScreenRow[];
};

function metricPassesFilter(metric: ScreenMetricValue | undefined, filter: RangeFilter): boolean {
  if (!metric || metric.dataQuality !== "complete" || metric.value === null) {
    return false;
  }
  if (filter.min !== null && metric.value < filter.min) {
    return false;
  }
  if (filter.max !== null && metric.value > filter.max) {
    return false;
  }
  return true;
}

export async function runScreen(input: ScreenInput): Promise<ScreenResult> {
  const validation = validateRangeFilters(input.filters);
  if (!validation.ok) {
    throw new Error(validation.errors.map((error) => `${error.field}: ${error.message}`).join("; "));
  }

  const stocks = await prisma.stock.findMany({
    where: {
      market: { code: { in: input.markets } },
      isActive: true,
    },
    include: {
      market: true,
      derivedMetrics: true,
    },
  });

  const rows: ScreenRow[] = stocks.map((stock) => {
    const metrics: Record<string, ScreenMetricValue> = {};
    for (const metric of stock.derivedMetrics) {
      metrics[metric.metricKey] = {
        value: metric.value === null ? null : Number(metric.value),
        dataQuality: metric.dataQuality,
        reason: metric.reason,
        currency: metric.currency,
      };
    }
    return {
      marketCode: stock.market.code,
      exchange: stock.exchange,
      stockCode: stock.stockCode,
      stockName: stock.stockName,
      currency: stock.currency,
      metrics,
    };
  });

  const filteredRows = rows.filter((row) =>
    validation.filters.every((filter) => metricPassesFilter(row.metrics[filter.metricKey], filter)),
  );

  filteredRows.sort((left, right) => {
    const direction = input.sort.direction === "asc" ? 1 : -1;
    if (input.sort.metricKey === "stock_code") {
      return left.stockCode.localeCompare(right.stockCode) * direction;
    }
    if (input.sort.metricKey === "stock_name") {
      return left.stockName.localeCompare(right.stockName) * direction;
    }
    const leftValue = left.metrics[input.sort.metricKey]?.value ?? Number.POSITIVE_INFINITY;
    const rightValue = right.metrics[input.sort.metricKey]?.value ?? Number.POSITIVE_INFINITY;
    return (leftValue - rightValue) * direction;
  });

  const total = filteredRows.length;
  const start = (input.page - 1) * input.pageSize;
  const pagedRows = filteredRows.slice(start, start + input.pageSize);

  await prisma.screenRun.create({
    data: {
      selectedMarkets: JSON.stringify(input.markets),
      filtersJson: JSON.stringify(validation.filters),
      resultCount: total,
    },
  });

  return {
    criteria: validation.filters,
    total,
    page: input.page,
    pageSize: input.pageSize,
    rows: pagedRows,
  };
}
```

- [ ] **Step 4: Run screener tests**

Run:

```powershell
npm test -- src/server/screener/screenerService.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit screener service**

Run:

```powershell
git add src/server/screener
git commit -m "feat: add screener query service"
```

## Task 8: API Routes

**Files:**

- Create: `src/app/api/screen/route.ts`
- Create: `src/app/api/export/route.ts`
- Create: `src/server/export/csvExport.ts`
- Create: `src/server/export/csvExport.test.ts`

- [ ] **Step 1: Create CSV export tests**

Create `src/server/export/csvExport.test.ts`:

```ts
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
            pe_ratio: { value: 25.98, dataQuality: "complete", reason: null, currency: null },
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
```

- [ ] **Step 2: Implement CSV export builder**

Create `src/server/export/csvExport.ts`:

```ts
import type { RangeFilter } from "@/domain/types";
import type { ScreenRow } from "@/server/screener/screenerService";

function cell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replaceAll("\"", "\"\"")}"`;
  }
  return raw;
}

export function buildScreenCsv(input: {
  generatedAt: Date;
  criteria: RangeFilter[];
  rows: ScreenRow[];
}): string {
  const metricKeys = Array.from(
    new Set(input.criteria.map((criterion) => criterion.metricKey)),
  );

  const lines: string[] = [];
  lines.push(["Generated At", input.generatedAt.toISOString()].map(cell).join(","));
  lines.push("");
  lines.push(["Metric", "Minimum", "Maximum"].map(cell).join(","));
  for (const criterion of input.criteria) {
    lines.push([criterion.metricKey, criterion.min ?? "", criterion.max ?? ""].map(cell).join(","));
  }
  lines.push("");
  lines.push(["Market", "Exchange", "Stock Code", "Stock Name", "Currency", ...metricKeys].map(cell).join(","));
  for (const row of input.rows) {
    lines.push(
      [
        row.marketCode,
        row.exchange,
        row.stockCode,
        row.stockName,
        row.currency,
        ...metricKeys.map((key) => row.metrics[key]?.value ?? row.metrics[key]?.dataQuality ?? ""),
      ]
        .map(cell)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
```

- [ ] **Step 3: Run export tests**

Run:

```powershell
npm test -- src/server/export/csvExport.test.ts
```

Expected: PASS.

- [ ] **Step 4: Implement screen API route**

Create `src/app/api/screen/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { metricKeys } from "@/domain/filtering";
import { runScreen } from "@/server/screener/screenerService";

const requestSchema = z.object({
  markets: z.array(z.string()).min(1),
  filters: z.array(
    z.object({
      metricKey: z.enum(metricKeys),
      min: z.number().finite().nullable(),
      max: z.number().finite().nullable(),
    }),
  ),
  sort: z.object({
    metricKey: z.union([z.enum(metricKeys), z.literal("stock_code"), z.literal("stock_name")]),
    direction: z.enum(["asc", "desc"]),
  }),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const result = await runScreen(parsed.data);
  return NextResponse.json(result);
}
```

- [ ] **Step 5: Implement export API route**

Create `src/app/api/export/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { metricKeys } from "@/domain/filtering";
import { buildScreenCsv } from "@/server/export/csvExport";
import { runScreen } from "@/server/screener/screenerService";

const requestSchema = z.object({
  markets: z.array(z.string()).min(1),
  filters: z.array(
    z.object({
      metricKey: z.enum(metricKeys),
      min: z.number().finite().nullable(),
      max: z.number().finite().nullable(),
    }),
  ),
  sort: z.object({
    metricKey: z.union([z.enum(metricKeys), z.literal("stock_code"), z.literal("stock_name")]),
    direction: z.enum(["asc", "desc"]),
  }),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const result = await runScreen({
    ...parsed.data,
    page: 1,
    pageSize: 10_000,
  });

  const csv = buildScreenCsv({
    generatedAt: new Date(),
    criteria: result.criteria,
    rows: result.rows,
  });

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=\"stock-screen.csv\"",
    },
  });
}
```

- [ ] **Step 6: Run API-adjacent tests**

Run:

```powershell
npm test -- src/server/export/csvExport.test.ts src/server/screener/screenerService.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit API routes**

Run:

```powershell
git add src/app/api src/server/export
git commit -m "feat: add screener and export APIs"
```

## Task 9: Frontend Screener Workspace

**Files:**

- Modify: `src/app/page.tsx`
- Create: `src/components/MarketSelector.tsx`
- Create: `src/components/FilterBuilder.tsx`
- Create: `src/components/CriteriaSummary.tsx`
- Create: `src/components/ResultsTable.tsx`
- Create: `src/components/DataQualityBadge.tsx`
- Create: `src/components/ExportButton.tsx`
- Create: `src/app/page.test.tsx`

- [ ] **Step 1: Write frontend smoke test**

Create `src/app/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the screener workspace", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Stock Screener" })).toBeInTheDocument();
    expect(screen.getByLabelText("United States")).toBeInTheDocument();
    expect(screen.getByLabelText("Singapore")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run Screen" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create data quality badge**

Create `src/components/DataQualityBadge.tsx`:

```tsx
const labels: Record<string, string> = {
  complete: "Fresh",
  fresh: "Fresh",
  stale: "Stale",
  missing: "Missing",
  unavailable: "Unavailable",
  csv: "CSV",
};

export function DataQualityBadge({ status }: { status: string }) {
  return <span className={`quality quality-${status}`}>{labels[status] ?? status}</span>;
}
```

- [ ] **Step 3: Create market selector**

Create `src/components/MarketSelector.tsx`:

```tsx
export function MarketSelector({
  selectedMarkets,
  onChange,
}: {
  selectedMarkets: string[];
  onChange: (markets: string[]) => void;
}) {
  function toggle(market: string) {
    if (selectedMarkets.includes(market)) {
      onChange(selectedMarkets.filter((item) => item !== market));
      return;
    }
    onChange([...selectedMarkets, market]);
  }

  return (
    <fieldset className="panel">
      <legend>Markets</legend>
      <label>
        <input
          aria-label="United States"
          type="checkbox"
          checked={selectedMarkets.includes("US")}
          onChange={() => toggle("US")}
        />
        United States
      </label>
      <label>
        <input
          aria-label="Singapore"
          type="checkbox"
          checked={selectedMarkets.includes("SGX")}
          onChange={() => toggle("SGX")}
        />
        Singapore
      </label>
    </fieldset>
  );
}
```

- [ ] **Step 4: Create filter builder**

Create `src/components/FilterBuilder.tsx`:

```tsx
import type { RangeFilter } from "@/domain/types";

const availableFilters: { metricKey: RangeFilter["metricKey"]; label: string }[] = [
  { metricKey: "market_cap", label: "Market Cap" },
  { metricKey: "revenue_growth_rate", label: "Revenue Growth" },
  { metricKey: "profit_growth_rate", label: "Profit Growth" },
  { metricKey: "dividend_yield", label: "Dividend Yield" },
  { metricKey: "dividend_growth_rate", label: "Dividend Growth" },
  { metricKey: "pe_ratio", label: "P/E" },
  { metricKey: "pb_ratio", label: "P/B" },
  { metricKey: "debt_to_equity_ratio", label: "Debt To Equity" },
  { metricKey: "close", label: "Close Price" },
];

export function FilterBuilder({
  filters,
  onChange,
}: {
  filters: RangeFilter[];
  onChange: (filters: RangeFilter[]) => void;
}) {
  function update(index: number, patch: Partial<RangeFilter>) {
    onChange(filters.map((filter, itemIndex) => (itemIndex === index ? { ...filter, ...patch } : filter)));
  }

  function addFilter() {
    onChange([...filters, { metricKey: "pe_ratio", min: null, max: null }]);
  }

  function removeFilter(index: number) {
    onChange(filters.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Filters</h2>
        <button type="button" onClick={addFilter}>
          Add Filter
        </button>
      </div>
      <div className="filter-list">
        {filters.map((filter, index) => (
          <div className="filter-row" key={`${filter.metricKey}-${index}`}>
            <select
              aria-label={`Metric ${index + 1}`}
              value={filter.metricKey}
              onChange={(event) => update(index, { metricKey: event.target.value as RangeFilter["metricKey"] })}
            >
              {availableFilters.map((option) => (
                <option key={option.metricKey} value={option.metricKey}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              aria-label={`Minimum ${index + 1}`}
              type="number"
              placeholder="Min"
              value={filter.min ?? ""}
              onChange={(event) => update(index, { min: event.target.value === "" ? null : Number(event.target.value) })}
            />
            <input
              aria-label={`Maximum ${index + 1}`}
              type="number"
              placeholder="Max"
              value={filter.max ?? ""}
              onChange={(event) => update(index, { max: event.target.value === "" ? null : Number(event.target.value) })}
            />
            <button type="button" onClick={() => removeFilter(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create criteria summary**

Create `src/components/CriteriaSummary.tsx`:

```tsx
import type { RangeFilter } from "@/domain/types";

export function CriteriaSummary({ markets, filters }: { markets: string[]; filters: RangeFilter[] }) {
  return (
    <section className="panel">
      <h2>Selected Criteria</h2>
      <p>Markets: {markets.join(", ") || "None"}</p>
      <ul>
        {filters.map((filter, index) => (
          <li key={`${filter.metricKey}-${index}`}>
            {filter.metricKey}: {filter.min ?? "no min"} to {filter.max ?? "no max"}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Create results table**

Create `src/components/ResultsTable.tsx`:

```tsx
import { DataQualityBadge } from "./DataQualityBadge";

type ScreenMetricValue = {
  value: number | null;
  dataQuality: string;
  reason: string | null;
  currency: string | null;
};

type ScreenRow = {
  marketCode: string;
  exchange: string;
  stockCode: string;
  stockName: string;
  currency: string;
  metrics: Record<string, ScreenMetricValue>;
};

export function ResultsTable({ rows, metricKeys }: { rows: ScreenRow[]; metricKeys: string[] }) {
  return (
    <section className="panel table-panel">
      <h2>Results</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Market</th>
              <th>Exchange</th>
              <th>Code</th>
              <th>Name</th>
              <th>Currency</th>
              {metricKeys.map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.marketCode}-${row.stockCode}`}>
                <td>{row.marketCode}</td>
                <td>{row.exchange}</td>
                <td>{row.stockCode}</td>
                <td>{row.stockName}</td>
                <td>{row.currency}</td>
                {metricKeys.map((key) => {
                  const metric = row.metrics[key];
                  return (
                    <td key={key}>
                      {metric?.value === null || metric?.value === undefined ? "N/A" : metric.value.toLocaleString()}
                      {metric ? <DataQualityBadge status={metric.dataQuality} /> : <DataQualityBadge status="missing" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create export button**

Create `src/components/ExportButton.tsx`:

```tsx
import type { RangeFilter } from "@/domain/types";

export function ExportButton({ markets, filters }: { markets: string[]; filters: RangeFilter[] }) {
  async function exportCsv() {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        markets,
        filters,
        sort: { metricKey: "stock_code", direction: "asc" },
      }),
    });
    if (!response.ok) {
      window.alert("Export failed. Please try again.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "stock-screen.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={exportCsv}>
      Export CSV
    </button>
  );
}
```

- [ ] **Step 8: Replace page with client screener workspace**

Create `src/app/page.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { CriteriaSummary } from "@/components/CriteriaSummary";
import { ExportButton } from "@/components/ExportButton";
import { FilterBuilder } from "@/components/FilterBuilder";
import { MarketSelector } from "@/components/MarketSelector";
import { ResultsTable } from "@/components/ResultsTable";
import type { RangeFilter } from "@/domain/types";

type ScreenResult = {
  rows: Array<{
    marketCode: string;
    exchange: string;
    stockCode: string;
    stockName: string;
    currency: string;
    metrics: Record<string, { value: number | null; dataQuality: string; reason: string | null; currency: string | null }>;
  }>;
  total: number;
};

export default function HomePage() {
  const [markets, setMarkets] = useState(["US", "SGX"]);
  const [filters, setFilters] = useState<RangeFilter[]>([{ metricKey: "pe_ratio", min: 1, max: 40 }]);
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const metricKeys = useMemo(() => filters.map((filter) => filter.metricKey), [filters]);

  async function runScreen() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/screen", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        markets,
        filters,
        sort: { metricKey: "stock_code", direction: "asc" },
        page: 1,
        pageSize: 50,
      }),
    });
    setLoading(false);
    if (!response.ok) {
      setError("Screen failed. Check filter values and try again.");
      return;
    }
    setResult((await response.json()) as ScreenResult);
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <h1>Stock Screener</h1>
          <p>Filter end-of-day US and Singapore stocks for further research.</p>
        </div>
        <ExportButton markets={markets} filters={filters} />
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <MarketSelector selectedMarkets={markets} onChange={setMarkets} />
          <FilterBuilder filters={filters} onChange={setFilters} />
          <button className="primary" type="button" onClick={runScreen} disabled={loading || markets.length === 0}>
            {loading ? "Running..." : "Run Screen"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </aside>

        <section className="content">
          <CriteriaSummary markets={markets} filters={filters} />
          <p className="disclaimer">
            Screening results are research candidates, not financial advice. Data may be delayed, missing, or imported
            from CSV.
          </p>
          <ResultsTable rows={result?.rows ?? []} metricKeys={metricKeys} />
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 9: Add workspace styles**

Append to `src/app/globals.css`:

```css
.page-header,
.workspace,
.panel-title,
.filter-row {
  display: flex;
  gap: 16px;
}

.page-header {
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.workspace {
  align-items: flex-start;
}

.sidebar {
  display: grid;
  gap: 12px;
  width: 340px;
  flex: 0 0 340px;
}

.content {
  display: grid;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.panel h2,
.panel p {
  margin-top: 0;
}

.panel-title {
  align-items: center;
  justify-content: space-between;
}

.filter-list {
  display: grid;
  gap: 8px;
}

.filter-row {
  align-items: center;
}

.filter-row select,
.filter-row input {
  min-width: 0;
  width: 100%;
}

.primary {
  border: 0;
  border-radius: 6px;
  background: var(--accent);
  color: white;
  padding: 10px 14px;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th,
td {
  border-bottom: 1px solid var(--border);
  padding: 8px;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
}

.quality {
  display: inline-block;
  margin-left: 6px;
  border-radius: 999px;
  border: 1px solid var(--border);
  padding: 2px 6px;
  font-size: 12px;
  color: var(--muted);
}

.quality-missing,
.quality-unavailable,
.error {
  color: var(--danger);
}

.quality-stale {
  color: var(--warning);
}

.quality-complete,
.quality-fresh {
  color: var(--success);
}

.disclaimer {
  color: var(--muted);
  font-size: 14px;
}

@media (max-width: 860px) {
  .workspace,
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .sidebar {
    width: 100%;
    flex-basis: auto;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
}
```

- [ ] **Step 10: Run frontend test**

Run:

```powershell
npm test -- src/app/page.test.tsx
```

Expected: PASS.

- [ ] **Step 11: Commit frontend workspace**

Run:

```powershell
git add src/app src/components
git commit -m "feat: add stock screener workspace"
```

## Task 10: End-To-End Smoke Test

**Files:**

- Create: `tests/e2e/screener.spec.ts`

- [ ] **Step 1: Create Playwright smoke test**

Create `tests/e2e/screener.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("runs a stock screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Stock Screener" })).toBeVisible();
  await page.getByRole("button", { name: "Run Screen" }).click();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByText("AAPL")).toBeVisible();
});
```

- [ ] **Step 2: Prepare local database for E2E**

Run:

```powershell
npm run import:fixtures
npm run metrics:recompute
```

Expected: both commands print JSON summaries.

- [ ] **Step 3: Run E2E test**

Run:

```powershell
npm run test:e2e
```

Expected: PASS in Chromium.

- [ ] **Step 4: Commit E2E test**

Run:

```powershell
git add tests/e2e/screener.spec.ts
git commit -m "test: add screener smoke test"
```

## Task 11: README Update

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Replace README with setup and usage guide**

Modify `README.md`:

````md
# Stock Screener

End-of-day stock screener for US and Singapore stocks. The app is a research
tool for filtering candidate stocks, not financial advice.

## V1 Scope

- US and Singapore stock markets.
- End-of-day OHLC data.
- Annual fundamentals and dividends.
- Local SQLite data cache.
- Formula-based derived metrics.
- Range-based stock screening.
- Missing-data indicators.
- CSV export.

## Setup

```powershell
npm install
Copy-Item .env.example .env
npm run db:generate
npm run db:migrate -- --name init
npm run import:fixtures
npm run metrics:recompute
```

## Run

```powershell
npm run dev
```

Open `http://127.0.0.1:3000`.

## Test

```powershell
npm test
npm run test:e2e
```

## Data Notes

The fixture dataset is deterministic and exists for development. Production
market data should be imported through provider adapters or CSV import. V1 uses
native currencies and does not convert USD and SGD values.

## Non-Advice Notice

Screening results are research candidates. They are not buy, sell, or hold
recommendations. Data may be delayed, missing, stale, or imported from CSV.
````

- [ ] **Step 2: Run all checks**

Run:

```powershell
npm test
npm run build
npm run test:e2e
```

Expected: all commands pass.

- [ ] **Step 3: Commit README**

Run:

```powershell
git add README.md
git commit -m "docs: add stock screener setup guide"
```

## Task 12: Final Verification

**Files:**

- No new files unless verification exposes defects.

- [ ] **Step 1: Check Git status**

Run:

```powershell
git status --short
```

Expected: only intentionally untracked external artifacts remain, such as `Stock Screener Application.pdf` if the team chooses not to track it.

- [ ] **Step 2: Run full verification**

Run:

```powershell
npm test
npm run build
npm run test:e2e
```

Expected: all commands pass.

- [ ] **Step 3: Manually verify the browser workflow**

Run:

```powershell
npm run dev
```

Open `http://127.0.0.1:3000` and verify:

- Market selector shows United States and Singapore.
- Default P/E filter is visible.
- Run Screen returns rows.
- Results show exchange, code, name, currency, and metric values.
- Missing or unavailable metrics show badges.
- CSV export downloads a file.
- Disclaimer is visible.

## Spec Coverage Review

This plan covers:

- Product scope: Task 9 implements market selection, filters, results, data quality display, CSV export, and non-advice copy.
- Architecture: Tasks 4 through 8 implement local SQLite data hub, import path, metric layer, API routes, and frontend.
- Data model and formulas: Tasks 2, 4, and 6 implement formulas, tables, edge cases, and formula versioning.
- Data flow: Tasks 5 through 8 implement fixture import, metric recompute, screening, export, and screen run audit.
- Error handling and testing: Tasks 2, 3, 5, 6, 7, 8, 9, and 10 add tests and explicit invalid/missing-data behavior.
- Data sourcing and logistics: Task 5 starts with deterministic fixtures and keeps CSV-style import as the first adapter path.

## Execution Notes

Use test-driven development task-by-task. Do not connect live providers before
the fixture-backed workflow is passing. Do not add AI review to V1.
