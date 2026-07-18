import { useTranslation } from "react-i18next";
import { Sparkles, Calendar, CalendarDays, DollarSign, Leaf, Gauge } from "lucide-react";

export default function SavingsSummary({ summary }) {
  const { t } = useTranslation();
  if (!summary) return null;

  const tiles = [
    { icon: Sparkles, label: t("energy.summary.todaySaved"), value: `${summary.today_energy_saved_kwh} kWh` },
    { icon: Calendar, label: t("energy.summary.monthlySaved"), value: `${summary.monthly_energy_saved_kwh} kWh` },
    { icon: CalendarDays, label: t("energy.summary.annualSaved"), value: `${summary.annual_energy_saved_kwh} kWh` },
    { icon: DollarSign, label: t("energy.summary.costSaved"), value: `$${summary.estimated_cost_saved}` },
    { icon: Leaf, label: t("energy.summary.co2Reduced"), value: `${summary.estimated_co2_reduced_kg} kg` },
    { icon: Gauge, label: t("energy.summary.efficiencyScore"), value: `${summary.efficiency_score_pct}%` },
  ];

  return (
    <div>
      <div className="card-title-row">
        <h3>{t("energy.summary.title")}</h3>
      </div>
      <div className="grid grid-cols-3">
        {tiles.map((tile) => (
          <div className="card" key={tile.label}>
            <div className="flex items-center gap-8 text-muted" style={{ fontSize: 12 }}>
              <tile.icon size={15} />
              {tile.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{tile.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
