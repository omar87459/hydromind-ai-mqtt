import { useTranslation } from "react-i18next";
import { Bot, ShieldCheck, Zap } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

export default function IssuesPanel({ issues, overallStatus, analyzing }) {
  const { t } = useTranslation();
  return (
    <div className="card">
      <div className="card-title-row">
        <h3 className="flex items-center gap-8">
          <Bot size={16} />
          {t("monitoring.aiDecisionEngine")}
        </h3>
        {analyzing ? <span className="spinner" /> : <StatusBadge status={overallStatus} />}
      </div>

      {(!issues || issues.length === 0) && !analyzing && (
        <div className="flex items-center gap-8 text-secondary" style={{ fontSize: 13, padding: "8px 0" }}>
          <ShieldCheck size={16} color="var(--status-good)" />
          {t("monitoring.allIdeal")}
        </div>
      )}

      <div className="flex flex-col gap-12 mt-8">
        {issues?.map((issue, i) => (
          <div
            key={i}
            className="card"
            style={{
              borderColor:
                issue.severity === "critical" ? "var(--status-critical)" : "var(--status-warning)",
              background: issue.severity === "critical" ? "var(--status-critical-bg)" : "var(--status-warning-bg)",
            }}
          >
            <div className="flex items-center justify-between">
              <StatusBadge status={issue.severity} small />
              <span className="badge badge-neutral">
                <Zap size={11} />
                {t("monitoring.confidencePct", { pct: Math.round(issue.confidence_score * 100) })}
              </span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "10px 0 4px" }}>
              {issue.problem_detected}
            </p>
            <p className="text-secondary" style={{ fontSize: 12.5, margin: "0 0 8px", lineHeight: 1.5 }}>
              {issue.recommended_action}
            </p>
            <div
              className="flex items-center gap-8"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "var(--brand-blue)",
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 10px",
              }}
            >
              {t("monitoring.automaticAction", { action: issue.automatic_action_suggestion })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
