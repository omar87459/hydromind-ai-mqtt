import { useTranslation } from "react-i18next";
import { Bot, ShieldCheck, TrendingDown } from "lucide-react";

export default function OptimizationPanel({ recommendations }) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="card-title-row">
        <h3 className="flex items-center gap-8">
          <Bot size={16} />
          {t("energy.optimization.title")}
        </h3>
      </div>
      <p className="text-secondary" style={{ fontSize: 12.5, marginTop: 0 }}>
        {t("energy.optimization.intro")}
      </p>

      {(!recommendations || recommendations.length === 0) && (
        <div className="flex items-center gap-8 text-secondary" style={{ fontSize: 13, padding: "8px 0" }}>
          <ShieldCheck size={16} color="var(--status-good)" />
          {t("energy.optimization.empty")}
        </div>
      )}

      <div className="flex flex-col gap-12 mt-8">
        {recommendations?.map((rec) => (
          <div key={rec.id} className="card" style={{ borderColor: "var(--brand-blue)" }}>
            <div className="flex items-center justify-between">
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{rec.title}</span>
              <span className="badge badge-blue">
                <TrendingDown size={11} />
                {rec.expected_saving_pct}%
              </span>
            </div>
            <p className="text-secondary mt-8" style={{ fontSize: 12.5, margin: "8px 0", lineHeight: 1.5 }}>
              {rec.recommendation}
            </p>
            <div className="flex items-center gap-16 wrap" style={{ fontSize: 11.5 }}>
              <span className="text-muted">
                {t("energy.optimization.expectedSaving")}: <strong>{rec.expected_saving_pct}%</strong>
              </span>
              <span className="text-muted">
                {t("energy.optimization.costSaving")}: <strong>${rec.estimated_cost_saving_per_day}{t("energy.optimization.perDay")}</strong>
              </span>
              <span className="text-muted">
                {t("energy.optimization.confidence")}: <strong>{Math.round(rec.confidence_score * 100)}%</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
