// Simple controlled tab strip. State-light on purpose: the parent decides
// `activeId` and what to render for it (conditionally, per-tab) — Tabs
// itself only renders the clickable strip.
export default function Tabs({ tabs, activeId, onChange }) {
  return (
    <div className="tabs-bar" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          className={`tab-button ${tab.id === activeId ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
