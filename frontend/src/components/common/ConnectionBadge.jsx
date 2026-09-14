import { useTranslation } from "react-i18next";

// Hardware badge: real & reporting (green), never wired up yet (neutral
// gray — an expected steady state, not an alarm), or real hardware that's
// gone quiet (red). Distinct from StatusBadge, which grades a reading
// against its ideal range rather than saying whether the data is real.
//
// There is deliberately no "simulation" state — nothing in this app may
// show a fabricated value, so there's nothing for a yellow badge to mark.
const CONFIG = {
  connected: { className: "badge-good", dot: "🟢", key: "connected" },
  not_connected: { className: "badge-neutral", dot: "⚪", key: "notConnected" },
  offline: { className: "badge-critical", dot: "🔴", key: "offline" },
};

export default function ConnectionBadge({ state, small }) {
  const { t } = useTranslation();
  const cfg = CONFIG[state] || CONFIG.not_connected;

  return (
    <span className={`badge ${cfg.className}`} style={small ? { fontSize: 10.5, padding: "2px 8px" } : undefined}>
      {cfg.dot} {t(`common.status.${cfg.key}`)}
    </span>
  );
}
