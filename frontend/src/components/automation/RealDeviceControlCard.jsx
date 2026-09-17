import { useEffect, useState } from "react";
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

// One real, relay- or MOSFET-controlled device (Main Pump / Refill Pump /
// pH Up / pH Down today). `password` is entered once by the caller and
// passed down; every action still round-trips through the real
// POST /iot/control password check server-side.
//
// `blocked` is set by the caller when this pump is part of a mutually
// exclusive pair (see MUTUALLY_EXCLUSIVE_PUMPS) and the OTHER pump in the
// pair is currently ON. This is a UI convenience only - the ESP32 firmware
// itself (setPhUpPump()/setPhDownPump()) is what actually enforces the
// interlock, so this can never be bypassed by acting fast in the UI.
//
// `brightness` (boolean) marks a device as PWM-dimmable (grow light only,
// today). `onBrightnessChange(percent, password)` round-trips through the
// real POST /iot/control/brightness endpoint - never applied locally only.
export default function RealDeviceControlCard({
  nameKey,
  pump,
  pending,
  password,
  onToggle,
  blocked,
  brightness,
  brightnessPending,
  onBrightnessChange,
}) {
  const { t } = useTranslation();
  const isOn = !!pump?.state;
  const confirmed = pump?.source === "esp32";
  const [localBrightness, setLocalBrightness] = useState(pump?.brightness ?? 0);

  useEffect(() => {
    if (pump?.brightness != null) setLocalBrightness(pump.brightness);
  }, [pump?.brightness]);

  function handle(state) {
    if (!password) {
      alert(t("automation.enterPassword"));
      return;
    }
    onToggle(state, password);
  }

  function commitBrightness(value) {
    if (!password) {
      alert(t("automation.enterPassword"));
      return;
    }
    onBrightnessChange(value, password);
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

      {blocked && (
        <span className="badge mt-8 badge-warning" style={{ display: "inline-flex", marginInlineStart: 6 }}>
          {t("automation.phDosingBlocked")}
        </span>
      )}

      <RequireAdmin>
        <div className="grid grid-cols-3 gap-6 mt-12">
          <button className="btn btn-sm" disabled title={t("automation.autoUnavailable")}>
            {t("automation.auto")}
          </button>
          <button
            className={`btn btn-sm ${isOn ? "" : "btn-primary"}`}
            disabled={pending || isOn || blocked}
            title={blocked ? t("automation.phDosingBlocked") : undefined}
            onClick={() => handle(true)}
          >
            {t("common.on")}
          </button>
          <button className="btn btn-sm" disabled={pending || !isOn} onClick={() => handle(false)}>
            {t("common.off")}
          </button>
        </div>

        {brightness && (
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <span className="kv-label" style={{ fontSize: 12 }}>
                {t("automation.brightness")}
              </span>
              <span className="kv-value">{localBrightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localBrightness}
              disabled={brightnessPending}
              onChange={(e) => setLocalBrightness(Number(e.target.value))}
              onMouseUp={(e) => commitBrightness(Number(e.target.value))}
              onTouchEnd={(e) => commitBrightness(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        )}
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
