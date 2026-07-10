import { useTranslation } from "react-i18next";
import { Cpu, Sparkles } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

export default function MLPredictionPanel({ prediction, loading, error }) {
  const { t } = useTranslation();
  return (
    <div className="card">
      <div className="card-title-row">
        <h3 className="flex items-center gap-8">
          <Cpu size={16} />
          {t("monitoring.mlHealthPrediction")}
        </h3>
        {loading ? (
          <span className="spinner" />
        ) : (
          prediction && <StatusBadge status={prediction.predicted_health_status.toLowerCase()} />
        )}
      </div>

      {error && (
        <p className="text-secondary" style={{ fontSize: 12.5 }}>
          {error}
        </p>
      )}

      {prediction && (
        <>
          <div className="flex items-center justify-between mt-8">
            <span className="text-muted" style={{ fontSize: 12 }}>
              {t("monitoring.riskScore")}
            </span>
            <span style={{ fontWeight: 700 }}>{prediction.risk_score}/100</span>
          </div>
          <div className="meter-track mt-8">
            <div
              className="meter-fill"
              style={{
                width: `${prediction.risk_score}%`,
                background:
                  prediction.risk_score >= 70
                    ? "var(--status-critical)"
                    : prediction.risk_score >= 35
                    ? "var(--status-warning)"
                    : "var(--status-good)",
              }}
            />
          </div>

          <div className="kv-row mt-16">
            <span className="kv-label">{t("monitoring.detectedProblem")}</span>
          </div>
          <p style={{ fontSize: 12.5, margin: "0 0 10px", fontWeight: 600 }}>
            {prediction.detected_problem || t("common.none")}
          </p>

          <div className="kv-row">
            <span className="kv-label">{t("monitoring.recommendedAction")}</span>
          </div>
          <p style={{ fontSize: 12.5, margin: "0 0 10px" }}>{prediction.recommended_action}</p>

          <div className="flex items-center gap-8 mt-8" style={{ fontSize: 11.5 }}>
            <Sparkles size={12} color="var(--brand-blue)" />
            <span className="text-muted">
              {t("common.confidence")} {Math.round(prediction.confidence_score * 100)}%
              {prediction.is_safety_override && (
                <span className="badge badge-critical" style={{ marginInlineStart: 6 }}>
                  {t("monitoring.safetyOverride")}
                </span>
              )}
            </span>
          </div>

          <p className="text-muted mt-16" style={{ fontSize: 11, lineHeight: 1.5 }}>
            {prediction.explanation}
          </p>
        </>
      )}
    </div>
  );
}
