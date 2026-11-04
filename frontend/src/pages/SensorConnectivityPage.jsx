import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, ShieldCheck, Zap } from "lucide-react";
import { fetchIotDiagnostics } from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import StatusBadge from "../components/common/StatusBadge";
import SensorDeviceCard from "../components/sensors/SensorDeviceCard";
import { useRealSensors } from "../hooks/useRealSensors";
import { REAL_SENSOR_NOTES, excludeNeverRealIssues } from "../utils/hardwareStatus";

const DIAGNOSTICS_POLL_INTERVAL_MS = 5000;

// Restored version of this page (the original was removed along with the
// simulation subsystem). Deliberately real-data-only: no mode toggle, no
// SIMULATED_DEVICES section - every card comes from useRealSensors(), the
// same single source of truth already used by the Overview snapshot and
// Live Monitoring, so a sensor the ESP32 hasn't reported shows "Not
// Connected", never a fabricated reading.
export default function SensorConnectivityPage() {
  const { t } = useTranslation();
  const { readings, loading, error } = useRealSensors();
  const [issues, setIssues] = useState([]);
  const [diagError, setDiagError] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function tick() {
      try {
        const diagData = await fetchIotDiagnostics();
        if (cancelledRef.current) return;
        setIssues(excludeNeverRealIssues(diagData.issues || []));
        setDiagError(null);
      } catch (err) {
        if (!cancelledRef.current) setDiagError(err.message || "Could not reach the backend.");
      }
    }

    tick();
    const interval = setInterval(tick, DIAGNOSTICS_POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, []);

  const cards = readings.map((r) => ({
    id: r.type,
    name: t(`sensors.names.${r.type}`),
    connectionState: r.connectionState,
    value: r.formattedValue,
    unit: r.unit,
    lastUpdate: r.lastUpdate,
    lastUpdateLabel: t("sensors.lastUpdate"),
    note: REAL_SENSOR_NOTES[r.type] ? t(REAL_SENSOR_NOTES[r.type]) : null,
    lines: r.secondaryLabel ? [{ label: r.secondaryLabel, value: r.secondaryValue }] : [],
  }));

  return (
    <div>
      <p className="section-sub">{t("sensors.intro")}</p>

      {error && <ErrorBlock message={error} />}

      {loading ? (
        <LoadingBlock label={t("common.loading")} />
      ) : (
        <>
          <div className="grid grid-cols-4">
            {cards.map((card) => (
              <SensorDeviceCard key={card.id} {...card} />
            ))}
          </div>

          <div className="card mt-24">
            <div className="card-title-row">
              <h3 className="flex items-center gap-8">
                <Bot size={16} />
                {t("sensors.diagnosticsTitle")}
              </h3>
            </div>

            {diagError && <ErrorBlock message={diagError} />}

            {!diagError && issues.length === 0 && (
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
