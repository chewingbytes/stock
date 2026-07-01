const sourceLabels: Record<string, string> = {
  yahoo_finance: "Yahoo Finance",
  fixture: "Sample data",
};

function formatSource(dataSource: string | null): string {
  if (!dataSource) return "No data";
  return sourceLabels[dataSource] ?? dataSource;
}

function formatUpdated(lastUpdated: string | null): string {
  if (!lastUpdated) return "Not imported yet";

  const date = new Date(lastUpdated);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffHours < 1) return "Updated just now";
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays}d ago`;

  return `Updated ${date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

export function UniverseSummary({
  universeTotal,
  matched,
  filteredOut,
  markets,
  lastUpdated,
  dataSource,
}: {
  universeTotal: number;
  matched: number;
  filteredOut: number;
  markets: string[];
  lastUpdated: string | null;
  dataSource: string | null;
}) {
  return (
    <section className="universe-summary" aria-label="Stock universe summary">
      <div className="summary-item">
        <span className="summary-value">{universeTotal.toLocaleString()}</span>
        <span className="summary-label">stocks in universe</span>
      </div>
      <div className="summary-item accent">
        <span className="summary-value">{matched.toLocaleString()}</span>
        <span className="summary-label">matched</span>
      </div>
      <div className="summary-item">
        <span className="summary-value">{filteredOut.toLocaleString()}</span>
        <span className="summary-label">filtered out</span>
      </div>
      <div className="summary-item">
        <span className="summary-value">{markets.join(", ") || "None"}</span>
        <span className="summary-label">selected markets</span>
      </div>
      <div className="summary-item">
        <span className="summary-value">{formatSource(dataSource)}</span>
        <span className="summary-label">{formatUpdated(lastUpdated)}</span>
      </div>
    </section>
  );
}
