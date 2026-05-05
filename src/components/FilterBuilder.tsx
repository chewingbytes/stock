import { beginnerMetricDefinitions } from "../domain/metricDefinitions";
import type { MetricKey, RangeFilter } from "../domain/types";

const starterMetrics: MetricKey[] = [
  "pe_ratio",
  "dividend_yield",
  "revenue_growth_rate",
  "debt_to_equity_ratio",
];

const availableFilters = Object.values(beginnerMetricDefinitions);

export function FilterBuilder({
  filters,
  onChange,
}: {
  filters: RangeFilter[];
  onChange: (filters: RangeFilter[]) => void;
}) {
  function update(index: number, patch: Partial<RangeFilter>) {
    onChange(
      filters.map((filter, itemIndex) =>
        itemIndex === index ? { ...filter, ...patch } : filter,
      ),
    );
  }

  function addFilter() {
    const nextMetric = availableFilters.find(
      (definition) =>
        !filters.some((filter) => filter.metricKey === definition.metricKey),
    );

    if (nextMetric) {
      addMetric(nextMetric.metricKey);
    }
  }

  function addMetric(metricKey: MetricKey) {
    if (filters.some((filter) => filter.metricKey === metricKey)) {
      return;
    }

    const definition = beginnerMetricDefinitions[metricKey];

    onChange([
      ...filters,
      {
        metricKey,
        min: definition.defaultRange.min,
        max: definition.defaultRange.max,
      },
    ]);
  }

  function removeFilter(index: number) {
    onChange(filters.filter((_, itemIndex) => itemIndex !== index));
  }

  function toggleMetric(metricKey: MetricKey) {
    const existingIndex = filters.findIndex(
      (filter) => filter.metricKey === metricKey,
    );

    if (existingIndex >= 0) {
      removeFilter(existingIndex);
      return;
    }

    addMetric(metricKey);
  }

  function metricOptionsFor(currentIndex: number) {
    const selectedByOtherRows = new Set(
      filters
        .filter((_, index) => index !== currentIndex)
        .map((filter) => filter.metricKey),
    );

    return availableFilters.filter(
      (option) => !selectedByOtherRows.has(option.metricKey),
    );
  }

  return (
    <section className="panel filter-builder">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Quick filters</p>
          <h2>Build your screen</h2>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={addFilter}
          disabled={filters.length >= availableFilters.length}
        >
          Add Filter
        </button>
      </div>

      <div className="metric-card-grid" aria-label="Quick filters">
        {starterMetrics.map((metricKey) => {
          const definition = beginnerMetricDefinitions[metricKey];
          const isActive = filters.some((filter) => filter.metricKey === metricKey);

          return (
            <button
              className={isActive ? "metric-card active" : "metric-card"}
              key={metricKey}
              onClick={() => toggleMetric(metricKey)}
              aria-pressed={isActive}
              aria-label={`${isActive ? "Remove" : "Add"} quick filter ${
                definition.label
              }`}
              type="button"
            >
              <span>
                {definition.label}
                <em>{isActive ? "On" : "Off"}</em>
              </span>
              <small>{definition.explanation}</small>
            </button>
          );
        })}
      </div>

      <div className="filter-list">
        {filters.map((filter, index) => (
          <div className="filter-row" key={`${filter.metricKey}-${index}`}>
            <select
              aria-label={`Metric ${index + 1}`}
              value={filter.metricKey}
              onChange={(event) =>
                update(index, {
                  metricKey: event.target.value as RangeFilter["metricKey"],
                })
              }
            >
              {metricOptionsFor(index).map((option) => (
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
              onChange={(event) =>
                update(index, {
                  min: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
            <input
              aria-label={`Maximum ${index + 1}`}
              type="number"
              placeholder="Max"
              value={filter.max ?? ""}
              onChange={(event) =>
                update(index, {
                  max: event.target.value === "" ? null : Number(event.target.value),
                })
              }
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
