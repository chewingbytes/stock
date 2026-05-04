import { getMetricDefinition } from "../domain/metricDefinitions";
import type { MetricKey } from "../domain/types";

export function MetricLearningPanel({ metricKey }: { metricKey: MetricKey }) {
  const definition = getMetricDefinition(metricKey);

  return (
    <aside className="learning-panel" aria-labelledby="learning-title">
      <p className="eyebrow">Learn this metric</p>
      <h2 id="learning-title">{definition.label}</h2>
      <p>{definition.explanation}</p>
      <div className="learning-note">
        <strong>Example</strong>
        <p>{definition.example}</p>
      </div>
      <div className="learning-note warning">
        <strong>Watch out</strong>
        <p>{definition.caution}</p>
      </div>
    </aside>
  );
}
