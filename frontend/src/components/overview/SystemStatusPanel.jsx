import { useTranslation } from "react-i18next";
import { Server, Cpu, Radio, Clock } from "lucide-react";

function relativeTime(iso) {
  if (!iso) return null;
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.max(0, Math.round(diff))}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  return `${Math.round(diff / 3600)}h`;
}

// All 4 tiles are derived from real signals only: serverOnline from the
// backend connection-phase gate (AppContext), esp32Connected/mqttStatus
// from real sensor reading recency (useRealSensors) — there is no backend
// "device online" field, so freshness of the last real reading is the
// most honest signal available. See hardwareStatus.js's STALE_THRESHOLD_MS.
export default function SystemStatusPanel({ serverOnline, esp32Connected, lastUpdate }) {
  const { t } = useTranslation();

  const tiles = [
    {
      icon: Server,
      label: t("overview.farmServerStatus"),
      value: serverOnline ? t("common.status.connected") : t("common.status.offline"),
      good: serverOnline,
    },
    {
      icon: Cpu,
      label: t("overview.esp32Status"),
      value: esp32Connected ? t("common.status.connected") : t("common.status.notConnected"),
      good: esp32Connected,
    },
    {
      icon: Radio,
      label: t("overview.mqttStatus"),
      value: esp32Connected ? t("common.status.connected") : t("common.status.notConnected"),
      good: esp32Connected,
    },
    {
      icon: Clock,
      label: t("overview.lastUpdate"),
      value: relativeTime(lastUpdate) || "—",
      good: null,
    },
  ];

  return (
    <div className="grid grid-cols-4">
      {tiles.map((tile) => (
        <div className="card" key={tile.label}>
          <div className="flex items-center gap-8 text-muted" style={{ fontSize: 12 }}>
            <tile.icon size={15} />
            {tile.label}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginTop: 8,
              color:
                tile.good === null
                  ? "var(--text-primary)"
                  : tile.good
                  ? "var(--status-good)"
                  : "var(--text-muted)",
            }}
          >
            {tile.value}
          </div>
        </div>
      ))}
    </div>
  );
}
