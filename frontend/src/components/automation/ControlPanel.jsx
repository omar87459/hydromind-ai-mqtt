import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { DEVICES } from "../../utils/automation";

export default function ControlPanel({ deviceStates, onToggle, suggestions }) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="card-title-row">
        <h3>{t("monitoring.automationPanel")}</h3>
      </div>
      <div className="flex flex-col gap-12">
        {DEVICES.map((device) => {
          const isOn = deviceStates[device.key];
          const suggestion = suggestions[device.key];
          const mismatched = suggestion && suggestion.on !== isOn;
          const deviceLabel = t(`monitoring.devices.${device.key}`);
          const reason = suggestion
            ? suggestion.reasonKey
              ? t(`monitoring.reasons.${suggestion.reasonKey}`)
              : suggestion.reasonText
            : null;
          return (
            <div
              key={device.key}
              className="flex items-center justify-between"
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="flex items-center gap-8">
                  <span style={{ fontSize: 17 }}>{device.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{deviceLabel}</span>
                  <span className={`badge ${isOn ? "badge-good" : "badge-neutral"}`}>
                    {isOn ? t("common.on") : t("common.off")}
                  </span>
                </div>
                {suggestion && (
                  <div className="flex items-center gap-6 mt-8" style={{ fontSize: 11.5 }}>
                    <Sparkles size={12} color="var(--brand-blue)" />
                    <span className="text-muted">
                      {t("monitoring.aiSuggests", {
                        state: suggestion.on ? t("common.on") : t("common.off"),
                        reason,
                      })}
                    </span>
                    {mismatched && (
                      <button
                        className="btn btn-sm"
                        style={{ padding: "2px 8px", fontSize: 10.5 }}
                        onClick={() => onToggle(device.key, suggestion.on)}
                      >
                        {t("common.apply")}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                className={`toggle ${isOn ? "on" : ""}`}
                onClick={() => onToggle(device.key, !isOn)}
                aria-label={t("monitoring.toggleDevice", { device: deviceLabel })}
                style={{ marginInlineStart: 12 }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
