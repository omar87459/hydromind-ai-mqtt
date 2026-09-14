import { useTranslation } from "react-i18next";
import { Zap, Activity, Gauge, BatteryCharging } from "lucide-react";
import ConnectionBadge from "../common/ConnectionBadge";

export default function PumpPowerCard({ title, power, running, connectionState }) {
  const { t } = useTranslation();

  const metrics = [
    { icon: Zap, label: t("energy.liveMetrics.voltage"), value: power?.voltage, unit: " V" },
    { icon: Activity, label: t("energy.liveMetrics.current"), value: power?.current, unit: " A" },
    { icon: Gauge, label: t("energy.liveMetrics.power"), value: power?.power, unit: " W" },
    { icon: BatteryCharging, label: t("energy.powerDashboard.energy"), value: power?.energyWh, unit: " Wh" },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <ConnectionBadge state={connectionState} />
      </div>

      <div className="grid grid-cols-2 gap-12 mt-12">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center gap-6 text-muted" style={{ fontSize: 11.5 }}>
              <m.icon size={13} />
              {m.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              {m.value !== undefined && m.value !== null ? Number(m.value).toFixed(2) : "—"}
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="kv-row mt-16">
        <span className="kv-label">{t("energy.powerDashboard.status")}</span>
        <span className={`badge ${running ? "badge-good" : "badge-neutral"}`}>
          {running ? t("hardware.running") : t("hardware.stopped")}
        </span>
      </div>
    </div>
  );
}
