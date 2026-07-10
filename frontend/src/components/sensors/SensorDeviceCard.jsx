import { useTranslation } from "react-i18next";
import { BatteryMedium, Wifi, Clock, Hash } from "lucide-react";

const CONNECTION_BADGE = {
  connected: "badge-good",
  weak_signal: "badge-warning",
  offline: "badge-critical",
};

const CONNECTION_DOT = { connected: "🟢", weak_signal: "🟡", offline: "🔴" };

const CONNECTION_KEY = {
  connected: "connected",
  weak_signal: "weakSignal",
  offline: "offline",
};

const HEALTH_BADGE = {
  excellent: "badge-good",
  good: "badge-good",
  needs_maintenance: "badge-warning",
  fault_detected: "badge-critical",
};

const HEALTH_KEY = {
  excellent: "excellent",
  good: "good",
  needs_maintenance: "needsMaintenance",
  fault_detected: "faultDetected",
};

function secondsAgo(isoTimestamp) {
  const diff = (Date.now() - new Date(isoTimestamp).getTime()) / 1000;
  if (diff < 60) return `${Math.max(0, Math.round(diff))}s`;
  return `${Math.round(diff / 60)}m`;
}

export default function SensorDeviceCard({ sensor }) {
  const { t } = useTranslation();
  const name = t(`sensors.names.${sensor.sensor_type}`);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
        <span className={`badge ${CONNECTION_BADGE[sensor.connection_status]}`}>
          {CONNECTION_DOT[sensor.connection_status]} {t(`common.status.${CONNECTION_KEY[sensor.connection_status]}`)}
        </span>
      </div>

      <div className="flex items-center gap-6 text-muted mt-8" style={{ fontSize: 11 }}>
        <Hash size={11} />
        {t("sensors.sensorId")}: {sensor.id}
      </div>

      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 10 }}>
        {sensor.reading}
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>{sensor.unit}</span>
      </div>

      <div className="kv-row mt-8">
        <span className="kv-label flex items-center gap-6">
          <Clock size={12} /> {t("sensors.lastUpdate")}
        </span>
        <span className="kv-value">{secondsAgo(sensor.last_update)}</span>
      </div>
      <div className="kv-row">
        <span className="kv-label flex items-center gap-6">
          <BatteryMedium size={12} /> {t("sensors.battery")}
        </span>
        <span className="kv-value">{sensor.battery_level}%</span>
      </div>
      <div className="kv-row">
        <span className="kv-label flex items-center gap-6">
          <Wifi size={12} /> {t("sensors.signal")}
        </span>
        <span className="kv-value">{sensor.signal_strength}%</span>
      </div>

      <div className="flex items-center justify-between mt-16">
        <span className="text-muted" style={{ fontSize: 12 }}>
          {t("sensors.health")}
        </span>
        <span className={`badge ${HEALTH_BADGE[sensor.health_status]}`}>
          {t(`common.health.${HEALTH_KEY[sensor.health_status]}`)}
        </span>
      </div>
    </div>
  );
}
