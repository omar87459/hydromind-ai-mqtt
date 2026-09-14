import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, ShieldCheck, Zap } from "lucide-react";
import { fetchIotDiagnostics } from "../../api";
import StatusBadge from "../common/StatusBadge";

const POLL_INTERVAL_MS = 5000;

// Real AI diagnostics over the sensor fleet's connection health (battery,
// signal, drift) — GET /iot/diagnostics. Moved here from the retired
// Sensor Connectivity page; genuinely real, fits "monitoring only" well.
export default function SensorDiagnosticsPanel() {
  const { t } = useTranslation();
  const [issues, setIssues] = useState([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function tick() {
      try {
        const data = await fetchIotDiagnostics();
        if (!cancelledRef.current) setIssues(data.issues || []);
      } catch {
        // Best-effort; the main sensor poll already surfaces backend errors.
      }
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="card">
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
              borderColor: issue.severity === "critical" ? "var(--status-critical)" : "var(--status-warning)",
              background: issue.severity === "critical" ? "var(--status-critical-bg)" : "var(--status-warning-bg)",
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
  );
}
