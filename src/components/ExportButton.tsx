import type { RangeFilter } from "../domain/types";

export function ExportButton({
  markets,
  filters,
}: {
  markets: string[];
  filters: RangeFilter[];
}) {
  async function exportCsv() {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        markets,
        filters,
        sort: { metricKey: "stock_code", direction: "asc" },
      }),
    });

    if (!response.ok) {
      window.alert("Export failed. Please try again.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "stock-screen.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="ghost-button" type="button" onClick={exportCsv}>
      <span aria-hidden="true">↓</span> Export CSV
    </button>
  );
}
