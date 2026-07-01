export type ScreenTab = "results" | "universe" | "learn";

const tabs: Array<{ id: ScreenTab; label: string }> = [
  { id: "results", label: "Results" },
  { id: "universe", label: "Stock Universe" },
  { id: "learn", label: "Learn" },
];

export function ScreenTabs({
  activeTab,
  onChange,
}: {
  activeTab: ScreenTab;
  onChange: (tab: ScreenTab) => void;
}) {
  return (
    <div className="screen-tabs" role="tablist" aria-label="Screen views">
      {tabs.map((tab) => (
        <button
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? "active" : ""}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
