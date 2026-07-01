export function UniverseSummary({
  universeTotal,
  matched,
  filteredOut,
  markets,
}: {
  universeTotal: number;
  matched: number;
  filteredOut: number;
  markets: string[];
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
        <span className="summary-value">Fixture data</span>
        <span className="summary-label">data mode</span>
      </div>
    </section>
  );
}
