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
        <span className="summary-value">{universeTotal}</span>
        <span className="summary-label">stocks in universe</span>
      </div>
      <div className="summary-item">
        <span className="summary-value">{matched}</span>
        <span className="summary-label">matched</span>
      </div>
      <div className="summary-item">
        <span className="summary-value">{filteredOut}</span>
        <span className="summary-label">filtered out</span>
      </div>
      <div className="summary-item">
        <span className="summary-value">{markets.join(", ")}</span>
        <span className="summary-label">selected markets</span>
      </div>
      <div className="summary-item">
        <span className="summary-value">Fixture data</span>
        <span className="summary-label">data mode</span>
      </div>
    </section>
  );
}
