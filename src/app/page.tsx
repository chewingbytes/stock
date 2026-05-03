"use client";

import { useMemo, useState } from "react";
import { CriteriaSummary } from "../components/CriteriaSummary";
import { ExportButton } from "../components/ExportButton";
import { FilterBuilder } from "../components/FilterBuilder";
import { MarketSelector } from "../components/MarketSelector";
import { ResultsTable } from "../components/ResultsTable";
import type { RangeFilter } from "../domain/types";

type ScreenResult = {
  rows: Array<{
    marketCode: string;
    exchange: string;
    stockCode: string;
    stockName: string;
    currency: string;
    metrics: Record<
      string,
      {
        value: number | null;
        dataQuality: string;
        reason: string | null;
        currency: string | null;
      }
    >;
  }>;
  total: number;
};

export default function HomePage() {
  const [markets, setMarkets] = useState(["US", "SGX"]);
  const [filters, setFilters] = useState<RangeFilter[]>([
    { metricKey: "pe_ratio", min: 1, max: 40 },
  ]);
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const metricKeys = useMemo(
    () => filters.map((filter) => filter.metricKey),
    [filters],
  );

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
          <button
            className="primary"
            type="button"
            onClick={runScreen}
            disabled={loading || markets.length === 0}
          >
            {loading ? "Running..." : "Run Screen"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </aside>

        <section className="content">
          <CriteriaSummary markets={markets} filters={filters} />
          <p className="disclaimer">
            Screening results are research candidates, not financial advice.
            Data may be delayed, missing, or imported from CSV.
          </p>
          <ResultsTable rows={result?.rows ?? []} metricKeys={metricKeys} />
        </section>
      </div>
    </main>
  );
}
