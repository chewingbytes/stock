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
    addMetric("pe_ratio");
  }

  function addMetric(metricKey: MetricKey) {
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

  return (
    <section className="panel filter-builder">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Beginner filters</p>
          <h2>Build your screen</h2>
        </div>
        <button className="secondary-button" type="button" onClick={addFilter}>
          Add Filter
        </button>
      </div>

      <div className="metric-card-grid" aria-label="Beginner metric library">
        {starterMetrics.map((metricKey) => {
          const definition = beginnerMetricDefinitions[metricKey];
          const isActive = filters.some((filter) => filter.metricKey === metricKey);

          return (
            <button
              className={isActive ? "metric-card active" : "metric-card"}
              disabled={isActive}
              key={metricKey}
              onClick={() => addMetric(metricKey)}
              type="button"
            >
              <span>{definition.label}</span>
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
