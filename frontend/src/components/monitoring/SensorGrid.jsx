import { useTranslation } from "react-i18next";
import { FlaskConical, Zap, Thermometer, Wind, Droplet, Waves, Sun } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

const PARAM_ICON = {
  ph: FlaskConical,
  ec: Zap,
  water_temp: Thermometer,
  air_temp: Wind,
  humidity: Droplet,
  water_level: Waves,
  light_intensity: Sun,
};

const PARAM_UNIT = {
  ph: "",
  ec: " mS/cm",
  water_temp: "°C",
  air_temp: "°C",
  humidity: "%",
  water_level: "%",
  light_intensity: " µmol/m²/s",
};

export default function SensorGrid({ reading, statusByParam }) {
  const { t } = useTranslation();
  const order = ["ph", "ec", "water_temp", "air_temp", "humidity", "water_level", "light_intensity"];

  return (
    <div className="grid grid-cols-4">
      {order.map((param) => {
        const Icon = PARAM_ICON[param];
        const value = reading?.[param];
        const status = statusByParam?.[param] || (param === "water_level" ? undefined : "unknown");
        return (
          <div className="card" key={param}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8 text-muted" style={{ fontSize: 12 }}>
                <Icon size={15} />
                {t(`monitoring.params.${param}`)}
              </div>
              {status && <StatusBadge status={status} small />}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>
              {value !== undefined ? value.toFixed(param === "ph" ? 2 : 1) : "--"}
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
                {PARAM_UNIT[param]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
