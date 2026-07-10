import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const PARAM_KEYS = [
  { key: "ph", unit: "" },
  { key: "ec", unit: " mS/cm" },
  { key: "water_temp", unit: "°C" },
  { key: "air_temp", unit: "°C" },
  { key: "humidity", unit: "%" },
  { key: "light_intensity", unit: " µmol/m²/s" },
];

function CustomTooltip({ active, payload, label, unit, paramLabel }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12.5,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="text-muted" style={{ fontSize: 11 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, color: "var(--brand-blue)" }}>
        {paramLabel}: {payload[0].value}
        {unit}
      </div>
    </div>
  );
}

export default function SensorTrendChart({ history }) {
  const { t } = useTranslation();
  const [param, setParam] = useState("ph");
  const active = PARAM_KEYS.find((p) => p.key === param);
  const activeLabel = t(`monitoring.params.${active.key}`);

  return (
    <div className="card">
      <div className="card-title-row">
        <h3>{t("monitoring.sensorTrend", { param: activeLabel })}</h3>
        <select
          value={param}
          onChange={(e) => setParam(e.target.value)}
          className="btn btn-sm"
          style={{ cursor: "pointer" }}
        >
          {PARAM_KEYS.map((p) => (
            <option key={p.key} value={p.key}>
              {t(`monitoring.params.${p.key}`)}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={44}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip unit={active.unit} paramLabel={activeLabel} />} />
          <Line
            type="monotone"
            dataKey={param}
            stroke="var(--brand-blue)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--brand-blue)", stroke: "var(--surface-1)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--brand-blue)", stroke: "var(--surface-1)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
