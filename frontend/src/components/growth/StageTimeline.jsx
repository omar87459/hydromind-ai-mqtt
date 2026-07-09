import { STAGE_LABELS } from "../../context/AppContext";
import { Sprout, Leaf, Flower2, Scissors } from "lucide-react";

const STAGE_ICONS = {
  seedling: Sprout,
  vegetative: Leaf,
  flowering_fruiting: Flower2,
  harvest: Scissors,
};

export default function StageTimeline({ stages, activeStage, onSelect }) {
  const activeIndex = stages.indexOf(activeStage);

  return (
    <div className="flex items-center" style={{ gap: 0 }}>
      {stages.map((stage, i) => {
        const Icon = STAGE_ICONS[stage];
        const isActive = stage === activeStage;
        const isDone = i < activeIndex;
        return (
          <div key={stage} className="flex items-center" style={{ flex: i < stages.length - 1 ? 1 : "0 0 auto" }}>
            <button
              onClick={() => onSelect(stage)}
              className="flex flex-col items-center gap-8"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "inherit",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isActive
                    ? "linear-gradient(135deg, var(--brand-blue), var(--brand-aqua))"
                    : isDone
                    ? "var(--status-good-bg)"
                    : "var(--page-plane)",
                  color: isActive ? "#fff" : isDone ? "var(--status-good)" : "var(--text-muted)",
                  border: isActive ? "none" : "1px solid var(--border)",
                }}
              >
                <Icon size={20} />
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--brand-blue)" : "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {STAGE_LABELS[stage]}
              </div>
            </button>
            {i < stages.length - 1 && (
              <div
                style={{
                  height: 2,
                  flex: 1,
                  margin: "0 8px 22px",
                  background: i < activeIndex ? "var(--status-good)" : "var(--gridline)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
