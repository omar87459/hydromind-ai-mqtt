import { useTranslation } from "react-i18next";
import ConnectionBadge from "../common/ConnectionBadge";

// A device named in the product spec with no backend/hardware support at
// all yet. Renders the full control shape (so the panel's future layout
// is visible) but every control is disabled — never a working button
// wired to nothing, never a fabricated status.
export default function NotConnectedDeviceCard({ nameKey, brightness }) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between">
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{t(nameKey)}</span>
        <ConnectionBadge state="not_connected" small />
      </div>

      <p className="text-muted mt-8" style={{ fontSize: 12 }}>
        {t("common.dataStatus.waitingForHardware")}
      </p>

      <div className="grid grid-cols-3 gap-6 mt-12">
        <button className="btn btn-sm" disabled>
          {t("automation.auto")}
        </button>
        <button className="btn btn-sm" disabled>
          {t("common.on")}
        </button>
        <button className="btn btn-sm" disabled>
          {t("common.off")}
        </button>
      </div>

      {brightness && (
        <div className="mt-12">
          <span className="kv-label" style={{ fontSize: 12 }}>
            {t("automation.brightness")}
          </span>
          <input type="range" min="0" max="100" disabled style={{ width: "100%" }} />
        </div>
      )}

      <div className="kv-row mt-12">
        <span className="kv-label">{t("automation.controlSource")}</span>
        <span className="kv-value">—</span>
      </div>
      <div className="kv-row">
        <span className="kv-label">{t("automation.lastAction")}</span>
        <span className="kv-value">—</span>
      </div>
    </div>
  );
}
