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
npx prisma migrate deploy
npm run import:fixtures
npm run metrics:recompute
```

## Run

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Test

```powershell
npm test
npm run build
npm run test:e2e
```

## Data Notes

The fixture dataset is deterministic and exists for development. Production
market data should be imported through provider adapters or CSV import. V1 uses
native currencies and does not convert USD and SGD values.

## Yahoo Finance Prototype Import

The Yahoo Finance importer is a personal/internal research prototype. Yahoo
Finance is an unofficial source for this workflow and should not be treated as
suitable for public data redistribution.

Run the prototype import and recompute derived metrics with:

```powershell
npm run import:yahoo
npm run metrics:recompute
```

Curated provider symbols live in:

- `data/provider-universe/us.csv`
- `data/provider-universe/sg.csv`

CSV import remains available for missing or corrected SGX fundamentals.

## Non-Advice Notice

Screening results are research candidates. They are not buy, sell, or hold
recommendations. Data may be delayed, missing, stale, or imported from CSV.
