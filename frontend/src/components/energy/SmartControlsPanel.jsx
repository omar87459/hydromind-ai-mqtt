import { useTranslation } from "react-i18next";
import { Sliders } from "lucide-react";

export default function SmartControlsPanel({ devices, mode, onToggleDevice, onBrightnessChange, onModeChange }) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="card-title-row">
        <h3 className="flex items-center gap-8">
          <Sliders size={16} />
          {t("energy.controls.title")}
        </h3>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: 16 }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {mode === "auto" ? t("energy.controls.aiAutoMode") : t("energy.controls.manualOverride")}
        </span>
        <button
          className={`toggle ${mode === "auto" ? "on" : ""}`}
          onClick={() => onModeChange(mode === "auto" ? "manual" : "auto")}
          aria-label={t("energy.controls.aiAutoMode")}
        />
      </div>

      <div className="flex flex-col gap-12">
        {(devices || []).map((device) => (
          <div
            key={device.id}
            className="flex flex-col gap-8"
            style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t(`energy.deviceNames.${device.id}`, device.id)}</span>
              <button
                className={`toggle ${device.is_on ? "on" : ""}`}
                onClick={() => onToggleDevice(device.id, !device.is_on)}
                aria-label={t(`energy.deviceNames.${device.id}`, device.id)}
              />
            </div>
            {device.id === "led_lights" && device.is_on && (
              <label className="flex items-center gap-8" style={{ fontSize: 11.5 }}>
                <span className="text-muted">{t("energy.controls.brightness")}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={device.brightness_pct ?? 100}
                  onChange={(e) => onBrightnessChange(device.id, Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontWeight: 600 }}>{device.brightness_pct ?? 100}%</span>
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
