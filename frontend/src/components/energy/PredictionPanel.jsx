import { useTranslation } from "react-i18next";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Cpu, ShieldCheck, AlertTriangle, Sparkles } from "lucide-react";

export default function PredictionPanel({ predictions }) {
  const { t } = useTranslation();
  if (!predictions) return null;

  const { next_day: nextDay, next_week: nextWeek, anomalies, equipment_risks: equipmentRisks } = predictions;

  return (
    <div className="card">
      <div className="card-title-row">
        <h3 className="flex items-center gap-8">
          <Cpu size={16} />
          {t("energy.predictions.title")}
        </h3>
      </div>
      <p className="text-secondary" style={{ fontSize: 12.5, marginTop: 0 }}>
        {t("energy.predictions.intro")}
      </p>

      <div className="grid grid-cols-2 mt-16">
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            {t("energy.predictions.nextDay")}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{nextDay.predicted_kwh} kWh</div>
          <div className="flex items-center gap-6 mt-8" style={{ fontSize: 11.5 }}>
            <Sparkles size={12} color="var(--brand-blue)" />
            <span className="text-muted">
              {t("energy.predictions.confidence")}: {Math.round(nextDay.confidence_score * 100)}%
            </span>
          </div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            {t("energy.predictions.nextWeek")}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{nextWeek.total_kwh} kWh</div>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={nextWeek.days} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--gridline)" vertical={false} />
              <XAxis dataKey="day_offset" hide />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [`${value} kWh`, ""]}
                labelFormatter={() => ""}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Bar dataKey="predicted_kwh" fill="var(--brand-aqua)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-16">
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{t("energy.predictions.anomaliesTitle")}</div>
        {(!anomalies || anomalies.length === 0) ? (
          <div className="flex items-center gap-8 text-secondary" style={{ fontSize: 12.5 }}>
            <ShieldCheck size={14} color="var(--status-good)" />
            {t("energy.predictions.noAnomalies")}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {anomalies.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-8"
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: a.severity === "critical" ? "var(--status-critical-bg)" : "var(--status-warning-bg)",
                }}
              >
                <AlertTriangle size={13} color={a.severity === "critical" ? "var(--status-critical)" : "var(--status-warning)"} />
                {a.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-16">
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{t("energy.predictions.equipmentRiskTitle")}</div>
        {(!equipmentRisks || equipmentRisks.length === 0) ? (
          <div className="flex items-center gap-8 text-secondary" style={{ fontSize: 12.5 }}>
            <ShieldCheck size={14} color="var(--status-good)" />
            {t("energy.predictions.noEquipmentRisk")}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {equipmentRisks.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-8"
                style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, background: "var(--status-warning-bg)" }}
              >
                <AlertTriangle size={13} color="var(--status-warning)" />
                {r.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
