import { useTranslation } from "react-i18next";
import { Zap, Activity, Gauge, BatteryCharging } from "lucide-react";
import ConnectionBadge from "../common/ConnectionBadge";

// Same visual layout as PumpPowerCard, for a device with no real power
// reading at all yet — every metric is "—", never a fabricated number.
export default function PlaceholderPowerCard({ title }) {
  const { t } = useTranslation();

  const metrics = [
    { icon: Zap, label: t("energy.liveMetrics.voltage"), unit: " V" },
    { icon: Activity, label: t("energy.liveMetrics.current"), unit: " A" },
    { icon: Gauge, label: t("energy.liveMetrics.power"), unit: " W" },
    { icon: BatteryCharging, label: t("energy.powerDashboard.energy"), unit: " Wh" },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <ConnectionBadge state="not_connected" />
      </div>

      <div className="grid grid-cols-2 gap-12 mt-12">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center gap-6 text-muted" style={{ fontSize: 11.5 }}>
              <m.icon size={13} />
              {m.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              —<span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-muted mt-16" style={{ fontSize: 11.5, margin: 0 }}>
        {t("common.dataStatus.waitingForHardware")}
      </p>
    </div>
  );
}
