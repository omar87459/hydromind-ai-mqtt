import { useTranslation } from "react-i18next";

// Three-state hardware badge: real & reporting (green), simulated /
// not physically connected (yellow), or real hardware that's gone quiet
// (red). Distinct from StatusBadge, which grades a reading against its
// ideal range rather than saying whether the data is real.
const CONFIG = {
  connected: { className: "badge-good", dot: "🟢", key: "connected" },
  simulation: { className: "badge-warning", dot: "🟡", key: "simulation" },
  offline: { className: "badge-critical", dot: "🔴", key: "offline" },
};

export default function ConnectionBadge({ state, small }) {
  const { t } = useTranslation();
  const cfg = CONFIG[state] || CONFIG.offline;

  return (
    <span className={`badge ${cfg.className}`} style={small ? { fontSize: 10.5, padding: "2px 8px" } : undefined}>
      {cfg.dot} {t(`common.status.${cfg.key}`)}
    </span>
  );
}
