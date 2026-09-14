import { useTranslation } from "react-i18next";
import ConnectionBadge from "../common/ConnectionBadge";
import RequireAdmin from "../common/RequireAdmin";

function relativeTime(iso) {
  if (!iso) return null;
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.max(0, Math.round(diff))}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  return `${Math.round(diff / 3600)}h`;
}

// One real, relay-controlled device (Main Pump / Refill Pump today — the
// only two with an actual backend endpoint). `password` is entered once
// by the caller and passed down; every action still round-trips through
// the real POST /iot/control password check server-side.
export default function RealDeviceControlCard({ nameKey, pump, pending, password, onToggle }) {
  const { t } = useTranslation();
  const isOn = !!pump?.state;
  const confirmed = pump?.source === "esp32";

  function handle(state) {
    if (!password) {
      alert(t("automation.enterPassword"));
      return;
    }
    onToggle(state, password);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{t(nameKey)}</span>
        <ConnectionBadge state={confirmed ? "connected" : "not_connected"} small />
      </div>

      <span className={`badge mt-8 ${isOn ? "badge-good" : "badge-neutral"}`} style={{ display: "inline-flex" }}>
        {isOn ? t("common.on") : t("common.off")}
      </span>

      <RequireAdmin>
        <div className="grid grid-cols-3 gap-6 mt-12">
          <button className="btn btn-sm" disabled title={t("automation.autoUnavailable")}>
            {t("automation.auto")}
          </button>
          <button
            className={`btn btn-sm ${isOn ? "" : "btn-primary"}`}
            disabled={pending || isOn}
            onClick={() => handle(true)}
          >
            {t("common.on")}
          </button>
          <button className="btn btn-sm" disabled={pending || !isOn} onClick={() => handle(false)}>
            {t("common.off")}
          </button>
        </div>
      </RequireAdmin>

      <div className="kv-row mt-12">
        <span className="kv-label">{t("automation.controlSource")}</span>
        <span className="kv-value">{t("automation.manual")}</span>
      </div>
      <div className="kv-row">
        <span className="kv-label">{t("automation.lastAction")}</span>
        <span className="kv-value">{relativeTime(pump?.last_update) || "—"}</span>
      </div>
    </div>
  );
}
