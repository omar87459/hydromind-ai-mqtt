import { useTranslation } from "react-i18next";
import { Sun, Droplet, Wind, Fan } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function GrowthStageEnergyPanel() {
  const { t } = useTranslation();
  const { selectedCrop, selectedStage } = useApp();
  if (!selectedCrop) return null;

  const stageData = selectedCrop.stages[selectedStage];
  const cropName = t(`common.cropNames.${selectedCrop.id}`, selectedCrop.name);

  const tiles = [
    { icon: Sun, label: t("energy.growthStage.lightingHours"), value: `${stageData.light_hours}h/day` },
    { icon: Droplet, label: t("energy.growthStage.pumpSchedule"), value: `${stageData.water_temp.min}-${stageData.water_temp.max}°C` },
    { icon: Fan, label: t("energy.growthStage.cooling"), value: `${stageData.air_temp.min}-${stageData.air_temp.max}°C` },
    { icon: Wind, label: t("energy.growthStage.ventilation"), value: `${selectedCrop.humidity_range.min}-${selectedCrop.humidity_range.max}%` },
  ];

  return (
    <div className="card">
      <div className="card-title-row">
        <h3>{t("energy.growthStage.title")}</h3>
      </div>
      <p className="text-secondary" style={{ fontSize: 12.5, marginTop: 0 }}>
        {t("energy.growthStage.intro")}
      </p>
      <div className="badge badge-aqua mt-8" style={{ marginBottom: 12 }}>
        {selectedCrop.icon} {cropName} — {t(`common.stages.${selectedStage}`)}
      </div>
      <div className="grid grid-cols-4">
        {tiles.map((tile) => (
          <div className="card" key={tile.label}>
            <div className="flex items-center gap-8 text-muted" style={{ fontSize: 11.5 }}>
              <tile.icon size={14} />
              {tile.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{tile.value}</div>
            <div className="text-muted" style={{ fontSize: 10, marginTop: 4 }}>
              {t("energy.growthStage.currentStageTarget")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
