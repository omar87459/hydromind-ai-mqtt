import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { fetchEnergyHistory, fetchEnergyDeviceComparison, fetchEnergyPeakHours } from "../../api";
import { LoadingBlock, ErrorBlock } from "../common/AsyncState";

const DEVICE_COLORS = [
  "var(--brand-blue)",
  "var(--brand-aqua)",
  "var(--brand-yellow)",
  "var(--brand-green)",
  "var(--brand-violet)",
  "var(--brand-red)",
  "var(--brand-magenta)",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function ChartTooltip({ active, payload, label, unit }) {
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
        {payload[0].value}
        {unit}
      </div>
    </div>
  );
}

export default function HistoricalCharts() {
  const { t } = useTranslation();
  const [granularity, setGranularity] = useState("daily");
  const [startDate, setStartDate] = useState(daysAgoStr(13));
  const [endDate, setEndDate] = useState(todayStr());
  const [series, setSeries] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchEnergyHistory(granularity, startDate, endDate),
      fetchEnergyDeviceComparison(startDate, endDate),
      fetchEnergyPeakHours(endDate),
    ])
      .then(([historyRes, comparisonRes, peakRes]) => {
        if (cancelled) return;
        setSeries(historyRes.series);
        setComparison(comparisonRes.comparison);
        setPeakHours(peakRes.hours);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [granularity, startDate, endDate]);

  const seriesKey = granularity === "daily" ? "date" : "period";

  return (
    <div className="card">
      <div className="card-title-row">
        <h3>{t("energy.history.title")}</h3>
      </div>

      <div className="flex items-center justify-between wrap gap-16 mt-8" style={{ marginBottom: 16 }}>
        <div className="flex gap-6">
          {["daily", "weekly", "monthly"].map((g) => (
            <button
              key={g}
              className="btn btn-sm"
              style={
                granularity === g
                  ? { background: "var(--brand-blue)", color: "#fff", borderColor: "var(--brand-blue)" }
                  : {}
              }
              onClick={() => setGranularity(g)}
            >
              {t(`energy.history.${g}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-8">
          <label className="flex items-center gap-6" style={{ fontSize: 12 }}>
            <span className="text-muted">{t("energy.history.startDate")}</span>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="btn btn-sm"
            />
          </label>
          <label className="flex items-center gap-6" style={{ fontSize: 12 }}>
            <span className="text-muted">{t("energy.history.endDate")}</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={todayStr()}
              onChange={(e) => setEndDate(e.target.value)}
              className="btn btn-sm"
            />
          </label>
        </div>
      </div>

      {error && <ErrorBlock message={error} />}
      {loading && !series && <LoadingBlock label={t("common.loading")} />}

      {series && (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--gridline)" vertical={false} />
              <XAxis
                dataKey={seriesKey}
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={{ stroke: "var(--baseline)" }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<ChartTooltip unit=" kWh" />} />
              <Line
                type="monotone"
                dataKey="total_kwh"
                stroke="var(--brand-blue)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--brand-blue)", stroke: "var(--surface-1)", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "var(--brand-blue)", stroke: "var(--surface-1)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 mt-16">
            <div>
              <h4 style={{ fontSize: 13, margin: "0 0 8px" }}>{t("energy.history.deviceComparison")}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparison} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="var(--gridline)" vertical={false} />
                  <XAxis
                    dataKey="device_id"
                    tick={{ fontSize: 9, fill: "var(--text-muted)" }}
                    axisLine={{ stroke: "var(--baseline)" }}
                    tickLine={false}
                    tickFormatter={(id) => t(`energy.deviceNames.${id}`, id)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<ChartTooltip unit=" kWh" />} />
                  <Bar dataKey="total_kwh" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
                    {(comparison || []).map((entry, i) => (
                      <Cell key={entry.device_id} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 style={{ fontSize: 13, margin: "0 0 8px" }}>{t("energy.history.peakHours")}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={peakHours} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="var(--gridline)" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 9, fill: "var(--text-muted)" }}
                    axisLine={{ stroke: "var(--baseline)" }}
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<ChartTooltip unit=" kWh" />} />
                  <Bar dataKey="avg_kwh" fill="var(--brand-aqua)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
