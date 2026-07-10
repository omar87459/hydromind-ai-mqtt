import { useTranslation } from "react-i18next";
import { Thermometer, Droplet, Wind, FlaskConical, Zap, Sun, Clock, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";

function MetricTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="card">
      <div className="flex items-center gap-8 text-muted" style={{ fontSize: 12 }}>
        <Icon size={15} />
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {sub && (
        <div className="text-muted mt-8" style={{ fontSize: 11.5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function CropDetail({ crop }) {
  const { t } = useTranslation();
  const { methods } = useApp();
  const compatibleMethods = methods.filter((m) => crop.suitable_methods.includes(m.id));
  const cropName = t(`common.cropNames.${crop.id}`, crop.name);

  return (
    <div>
      <div className="card-title-row">
        <h3>{t("crops.requirementsTitle", { icon: crop.icon, name: cropName })}</h3>
      </div>

      <div className="grid grid-auto">
        <MetricTile
          icon={Wind}
          label={t("crops.airTemperature")}
          value={`${crop.air_temp_range.min}–${crop.air_temp_range.max}°C`}
        />
        <MetricTile
          icon={Thermometer}
          label={t("crops.waterTemperature")}
          value={`${crop.water_temp_range.min}–${crop.water_temp_range.max}°C`}
        />
        <MetricTile
          icon={Droplet}
          label={t("crops.humidity")}
          value={`${crop.humidity_range.min}–${crop.humidity_range.max}%`}
        />
        <MetricTile
          icon={FlaskConical}
          label={t("crops.phRange")}
          value={`${crop.ph_range.min}–${crop.ph_range.max}`}
        />
        <MetricTile
          icon={Zap}
          label={t("crops.ecRange")}
          value={`${crop.ec_range.min}–${crop.ec_range.max} mS/cm`}
        />
        <MetricTile
          icon={Waves}
          label={t("crops.waterConsumption")}
          value={`${crop.water_consumption.value} L/day`}
          sub={crop.water_consumption.unit}
        />
        <MetricTile
          icon={Sun}
          label={t("crops.lightHours")}
          value={`${crop.light_hours.min}–${crop.light_hours.max} hrs/day`}
        />
        <MetricTile
          icon={Sun}
          label={t("crops.lightIntensity")}
          value={`${crop.light_intensity.min}–${crop.light_intensity.max}`}
          sub={crop.light_intensity.unit}
        />
        <MetricTile
          icon={Clock}
          label={t("crops.growthCycle")}
          value={`${crop.growth_cycle_days.min}–${crop.growth_cycle_days.max} days`}
        />
      </div>

      <div className="card mt-16">
        <div className="card-title-row">
          <h3>{t("crops.suitableMethods")}</h3>
          <Link to="/methods" className="btn btn-sm">
            {t("common.viewMethods")}
          </Link>
        </div>
        <div className="flex gap-8 wrap">
          {compatibleMethods.map((m) => (
            <span key={m.id} className="badge badge-blue">
              {m.icon} {m.short_name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
