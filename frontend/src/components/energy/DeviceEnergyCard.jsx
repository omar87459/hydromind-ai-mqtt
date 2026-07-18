import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

function formatRuntime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function DeviceEnergyCard({ device }) {
  const { t } = useTranslation();
  const name = t(`energy.deviceNames.${device.id}`, device.id);
  const capacityPct = Math.min(100, Math.round((device.power_w / device.rated_power_w) * 100));

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
        <span className={`badge ${device.is_on ? "badge-good" : "badge-neutral"}`}>
          {device.is_on ? t("energy.devices.on") : t("energy.devices.off")}
        </span>
      </div>

      <div className="flex items-center justify-between mt-8">
        <span className="text-muted" style={{ fontSize: 12 }}>
          {t("energy.devices.currentPower")}
        </span>
        <span style={{ fontWeight: 700 }}>{device.power_w} W</span>
      </div>
      <div className="meter-track mt-8">
        <div
          className="meter-fill"
          style={{
            width: `${capacityPct}%`,
            background: capacityPct > 90 ? "var(--status-warning)" : "var(--brand-blue)",
          }}
        />
      </div>

      <div className="kv-row mt-16">
        <span className="kv-label">{t("energy.devices.dailyEnergy")}</span>
        <span className="kv-value">{device.daily_energy_kwh} kWh</span>
      </div>
      <div className="kv-row">
        <span className="kv-label">{t("energy.devices.monthlyEnergy")}</span>
        <span className="kv-value">{device.monthly_energy_kwh} kWh</span>
      </div>
      <div className="kv-row">
        <span className="kv-label flex items-center gap-6">
          <Clock size={12} /> {t("energy.devices.runningTime")}
        </span>
        <span className="kv-value">{formatRuntime(device.running_time_seconds)}</span>
      </div>
    </div>
  );
}
