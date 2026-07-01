import { formatMetricLabel } from "../domain/metricDefinitions";
import type { RangeFilter } from "../domain/types";

export function RowExplanation({
  stockName,
  filters,
}: {
  stockName: string | null;
  filters: RangeFilter[];
}) {
  if (!stockName) {
    return (
      <section className="row-explanation">
        <h2>Why these stocks matched</h2>
        <p>Select a row to see how it matches your active criteria.</p>
      </section>
    );
  }

  return (
    <section className="row-explanation">
      <h2>Why {stockName} matched</h2>
      <p>
        This stock passed {filters.length} active{" "}
        {filters.length === 1 ? "filter" : "filters"}.
      </p>
      <ul>
        {filters.map((filter) => (
          <li key={filter.metricKey}>
            {formatMetricLabel(filter.metricKey)} is within the selected range.
          </li>
        ))}
      </ul>
    </section>
  );
}
