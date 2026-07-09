import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const PARAM_OPTIONS = [
  { key: "ph", label: "pH", unit: "" },
  { key: "ec", label: "EC", unit: " mS/cm" },
  { key: "water_temp", label: "Water Temp", unit: "°C" },
  { key: "air_temp", label: "Air Temp", unit: "°C" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "light_intensity", label: "Light Intensity", unit: " µmol/m²/s" },
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
  const [param, setParam] = useState("ph");
  const active = PARAM_OPTIONS.find((p) => p.key === param);

  return (
    <div className="card">
      <div className="card-title-row">
        <h3>Sensor Trend — {active.label}</h3>
        <select
          value={param}
          onChange={(e) => setParam(e.target.value)}
          className="btn btn-sm"
          style={{ cursor: "pointer" }}
        >
          {PARAM_OPTIONS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
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
          <Tooltip content={<CustomTooltip unit={active.unit} paramLabel={active.label} />} />
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
