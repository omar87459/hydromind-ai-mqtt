import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, ShieldCheck, Zap } from "lucide-react";
import { fetchIotSensors, fetchIotDiagnostics, fetchMqttData, postIotMode } from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import StatusBadge from "../components/common/StatusBadge";
import SensorDeviceCard from "../components/sensors/SensorDeviceCard";
import {
  REAL_SENSOR_TYPES,
  REAL_SENSOR_NOTES,
  SIMULATED_DEVICES,
  EC_PLAUSIBLE_RANGE,
} from "../utils/hardwareStatus";

const POLL_INTERVAL_MS = 2500;

function formatNumber(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return null;
  return Number(n).toFixed(digits);
}

export default function SensorConnectivityPage() {
  const { t } = useTranslation();
  const [sensors, setSensors] = useState(null);
  const [mqttData, setMqttData] = useState(null);
  const [mode, setMode] = useState("simulation");
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState(null);
  const [switching, setSwitching] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function tick() {
      try {
        const [sensorData, diagData, mqtt] = await Promise.all([
          fetchIotSensors(),
          fetchIotDiagnostics(),
          fetchMqttData(),
        ]);
        if (cancelledRef.current) return;
        setSensors(sensorData.sensors);
        setMode(sensorData.mode);
        setIssues(diagData.issues);
        setMqttData(mqtt);
        setError(null);
      } catch (err) {
        if (!cancelledRef.current) setError(err.message || "Could not reach the backend.");
      }
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, []);

  async function toggleMode() {
    const nextMode = mode === "simulation" ? "live" : "simulation";
    setSwitching(true);
    try {
      const result = await postIotMode(nextMode);
      setMode(result.mode);
    } catch (err) {
      setError(err.message || "Could not switch mode.");
    } finally {
      setSwitching(false);
    }
  }

  const sensorByType = {};
  (sensors || []).forEach((s) => (sensorByType[s.sensor_type] = s));

  const realCards = REAL_SENSOR_TYPES.map((type) => {
    const sensor = sensorByType[type];
    const isLive = sensor?.data_source === "esp32";
    const connectionState = isLive ? "connected" : "offline";

    const lines = [];
    if (type === "ec" && isLive) {
      const inRange = sensor.reading >= EC_PLAUSIBLE_RANGE[0] && sensor.reading <= EC_PLAUSIBLE_RANGE[1];
      lines.push({
        label: t("sensors.calibration"),
        value: inRange ? t("sensors.calibrationOk") : t("sensors.calibrationCheck"),
      });
    }

    const noteKey = REAL_SENSOR_NOTES[type];

    return {
      id: type,
      name: t(`sensors.names.${type}`),
      connectionState,
      value: isLive ? formatNumber(sensor.reading, type === "water_level" ? 0 : 2) : null,
      unit: sensor?.unit,
      lastUpdate: isLive ? sensor.last_update : null,
      lastUpdateLabel: t("sensors.lastUpdate"),
      note: noteKey ? t(noteKey) : null,
      lines,
    };
  });

  const simulatedCards = SIMULATED_DEVICES.map((device) => {
    let rawValue = device.mqttKey ? mqttData?.[device.mqttKey] : undefined;
    let display = null;

    if (typeof rawValue === "boolean") {
      display = rawValue ? t("common.on") : t("common.off");
    } else if (typeof rawValue === "number") {
      display = formatNumber(rawValue, 1);
    }

    return {
      id: device.id,
      name: t(device.nameKey),
      connectionState: "simulation",
      value: display,
      unit: display !== null ? device.unit : undefined,
      note: display !== null ? t("hardware.simulatedValue", { value: `${display}${device.unit || ""}` }) : t("hardware.notInstalled"),
    };
  });

  return (
    <div>
      <p className="section-sub">{t("sensors.intro")}</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between wrap gap-16">
          <span className={`badge ${mode === "simulation" ? "badge-warning" : "badge-good"}`}>
            {mode === "simulation"
              ? `🟡 ${t("sensors.simulationMode")}`
              : mode === "hybrid"
              ? `🟢 ${t("sensors.hybridDataMode")}`
              : `🟢 ${t("sensors.liveDataMode")}`}
          </span>
          <button className="btn btn-sm" onClick={toggleMode} disabled={switching}>
            {switching ? <span className="spinner" /> : null}
            {mode === "simulation" ? t("sensors.switchToLive") : t("sensors.switchToSimulation")}
          </button>
        </div>
        <p className="text-muted" style={{ fontSize: 11.5, margin: "8px 0 0" }}>
          {t("sensors.modeToggleNote")}
        </p>
      </div>

      {error && <ErrorBlock message={error} />}

      {mode === "live" && (
        <div className="card mt-8" style={{ borderColor: "var(--brand-blue)", marginBottom: 16 }}>
          <p className="text-secondary" style={{ fontSize: 12.5, margin: 0 }}>
            {t("sensors.noLiveData")}
          </p>
        </div>
      )}

      {!sensors ? (
        <LoadingBlock label={t("common.loading")} />
      ) : (
        <>
          <div className="card-title-row">
            <h3>{t("sensors.liveSectionTitle")}</h3>
          </div>
          <div className="grid grid-cols-4">
            {realCards.map((card) => (
              <SensorDeviceCard key={card.id} {...card} />
            ))}
          </div>

          <div className="mt-24">
            <div className="card-title-row">
              <h3>{t("sensors.simulatedSectionTitle")}</h3>
            </div>
            <p className="text-secondary" style={{ fontSize: 12.5, margin: "0 0 12px" }}>
              {t("sensors.simulatedSectionIntro")}
            </p>
            <div className="grid grid-cols-4">
              {simulatedCards.map((card) => (
                <SensorDeviceCard key={card.id} {...card} />
              ))}
            </div>
          </div>

          <div className="card mt-24">
            <div className="card-title-row">
              <h3 className="flex items-center gap-8">
                <Bot size={16} />
                {t("sensors.diagnosticsTitle")}
              </h3>
            </div>

            {issues.length === 0 && (
              <div className="flex items-center gap-8 text-secondary" style={{ fontSize: 13, padding: "8px 0" }}>
                <ShieldCheck size={16} color="var(--status-good)" />
                {t("sensors.diagnosticsEmpty")}
              </div>
            )}

            <div className="flex flex-col gap-12 mt-8">
              {issues.map((issue, i) => (
                <div
                  key={i}
                  className="card"
                  style={{
                    borderColor:
                      issue.severity === "critical" ? "var(--status-critical)" : "var(--status-warning)",
                    background:
                      issue.severity === "critical" ? "var(--status-critical-bg)" : "var(--status-warning-bg)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={issue.severity} small />
                    <span className="badge badge-neutral">
                      <Zap size={11} />
                      {Math.round(issue.confidence_score * 100)}%
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: "10px 0 4px" }}>{issue.problem}</p>
                  <p className="text-secondary" style={{ fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                    {issue.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
