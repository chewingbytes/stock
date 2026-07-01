const labels: Record<string, string> = {
  complete: "Fresh",
  fresh: "Fresh",
  stale: "Stale",
  missing: "Missing",
  unavailable: "Unavailable",
  csv: "CSV",
};

export function DataQualityBadge({ status }: { status: string }) {
  return (
    <span className={`quality quality-${status}`}>
      {labels[status] ?? status}
    </span>
  );
}
