import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, ShieldCheck, Zap } from "lucide-react";
import { fetchIotSensors, fetchIotDiagnostics, postIotMode } from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import StatusBadge from "../components/common/StatusBadge";
import SensorDeviceCard from "../components/sensors/SensorDeviceCard";

const POLL_INTERVAL_MS = 2500;

export default function SensorConnectivityPage() {
  const { t } = useTranslation();
  const [sensors, setSensors] = useState(null);
  const [mode, setMode] = useState("simulation");
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState(null);
  const [switching, setSwitching] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function tick() {
      try {
        const [sensorData, diagData] = await Promise.all([fetchIotSensors(), fetchIotDiagnostics()]);
        if (cancelledRef.current) return;
        setSensors(sensorData.sensors);
        setMode(sensorData.mode);
        setIssues(diagData.issues);
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

  return (
    <div>
      <p className="section-sub">{t("sensors.intro")}</p>

      <div className="card flex items-center justify-between wrap gap-16" style={{ marginBottom: 20 }}>
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
          <div className="grid grid-cols-4">
            {sensors.map((sensor) => (
              <SensorDeviceCard key={sensor.id} sensor={sensor} />
            ))}
          </div>

          <div className="card mt-16">
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
