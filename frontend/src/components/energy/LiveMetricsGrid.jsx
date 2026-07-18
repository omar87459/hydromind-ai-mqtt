import { useTranslation } from "react-i18next";
import { Zap, Activity, Gauge, BatteryCharging, Radio, TrendingUp, ShieldCheck } from "lucide-react";

const STATUS_BADGE = { Normal: "badge-good", Warning: "badge-warning", Critical: "badge-critical" };

export default function LiveMetricsGrid({ live }) {
  const { t } = useTranslation();
  if (!live) return null;

  const metrics = [
    { icon: Zap, label: t("energy.liveMetrics.voltage"), value: live.voltage, unit: " V" },
    { icon: Activity, label: t("energy.liveMetrics.current"), value: live.current, unit: " A" },
    { icon: Gauge, label: t("energy.liveMetrics.power"), value: live.power, unit: " W" },
    { icon: BatteryCharging, label: t("energy.liveMetrics.energy"), value: live.energy_kwh, unit: " kWh" },
    { icon: Radio, label: t("energy.liveMetrics.frequency"), value: live.frequency, unit: " Hz" },
    { icon: TrendingUp, label: t("energy.liveMetrics.powerFactor"), value: live.power_factor, unit: "" },
  ];

  return (
    <div className="grid grid-cols-4">
      {metrics.map((m) => (
        <div className="card" key={m.label}>
          <div className="flex items-center gap-8 text-muted" style={{ fontSize: 12 }}>
            <m.icon size={15} />
            {m.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>
            {m.value}
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>{m.unit}</span>
          </div>
        </div>
      ))}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8 text-muted" style={{ fontSize: 12 }}>
            <ShieldCheck size={15} />
            {t("energy.liveMetrics.systemStatus")}
          </div>
        </div>
        <div className="mt-8">
          <span className={`badge ${STATUS_BADGE[live.system_status] || "badge-neutral"}`}>
            {t(`energy.status.${live.system_status}`, live.system_status)}
          </span>
        </div>
      </div>
    </div>
  );
}
