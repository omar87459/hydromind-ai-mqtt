import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { fetchSensorData, postAnalyze, postRecommendAction } from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import SensorDeviceCard from "../components/sensors/SensorDeviceCard";
import SensorTrendChart from "../components/monitoring/SensorTrendChart";
import IssuesPanel from "../components/monitoring/IssuesPanel";
import MLPredictionPanel from "../components/monitoring/MLPredictionPanel";
import SensorDiagnosticsPanel from "../components/monitoring/SensorDiagnosticsPanel";
import GrowthStageEnergyPanel from "../components/energy/GrowthStageEnergyPanel";
import { useRealSensors } from "../hooks/useRealSensors";
import { REAL_SENSOR_TYPES, excludeNeverRealIssues, overallStatusFromIssues } from "../utils/hardwareStatus";

const POLL_INTERVAL_MS = 5000;
const HISTORY_LIMIT = 15;

export default function MonitoringPage() {
  const { t } = useTranslation();
  const { crops, loading, loadError, stages, selectedCropId, setSelectedCropId, selectedStage, setSelectedStage } =
    useApp();

  const { readings, freshestUpdate, allLive: allSensorsLive } = useRealSensors();

  const [overallStatus, setOverallStatus] = useState("unknown");
  const [issues, setIssues] = useState([]);
  const [issuesUnavailable, setIssuesUnavailable] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState([]);
  const [connError, setConnError] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState(null);

  const selectedCrop = crops.find((c) => c.id === selectedCropId);

  useEffect(() => {
    setHistory([]);
    let cancelled = false;

    async function tick() {
      let snapshot;
      try {
        setAnalyzing(true);
        snapshot = await fetchSensorData(selectedCropId, selectedStage);
        if (cancelled) return;
        setConnError(null);

        setHistory((prev) => {
          const next = [
            ...prev,
            {
              time: new Date(snapshot.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              ...snapshot.reading,
            },
          ];
          return next.slice(-HISTORY_LIMIT);
        });

        // The AI Decision Engine must only analyze real sensor data —
        // /sensor-data's reading mixes real and simulated fields for
        // whichever sensors haven't reported yet, so only call /analyze
        // once every real-capable field is confirmed live.
        const liveParams = new Set(snapshot.live_params || []);
        const allRequiredLive = REAL_SENSOR_TYPES.every((type) => liveParams.has(type));

        if (!allRequiredLive) {
          setIssues([]);
          setIssuesUnavailable(true);
        } else {
          const analysis = await postAnalyze(selectedCropId, selectedStage, snapshot.reading);
          if (cancelled) return;
          // snapshot.reading still always carries a light_intensity value
          // (there's no real light sensor) — strip any issue it generated
          // and derive status only from real-sensor issues.
          const realIssues = excludeNeverRealIssues(analysis.issues);
          setIssues(realIssues);
          setOverallStatus(overallStatusFromIssues(realIssues));
          setIssuesUnavailable(false);
        }
      } catch (err) {
        if (!cancelled) setConnError(err.message || "Could not reach the backend.");
      } finally {
        if (!cancelled) setAnalyzing(false);
      }

      // ML prediction only ever runs on real sensor data — if the ESP32
      // hasn't reported all 6 real-capable fields yet, show a friendly
      // "waiting for data" message instead of calling the model on a mix
      // of real and simulated numbers.
      if (selectedCrop && snapshot) {
        const liveParams = new Set(snapshot.live_params || []);
        const allRequiredLive = REAL_SENSOR_TYPES.every((type) => liveParams.has(type));

        if (!allRequiredLive) {
          if (!cancelled) {
            setMlPrediction(null);
            setMlError(t("monitoring.aiPredictionUnavailable"));
          }
        } else {
          try {
            setMlLoading(true);
            const stageData = selectedCrop.stages[selectedStage];
            const stageIndex = Object.keys(selectedCrop.stages).indexOf(selectedStage);
            const avgCycle = (selectedCrop.growth_cycle_days.min + selectedCrop.growth_cycle_days.max) / 2;
            const quarter = avgCycle / 4;
            const daysAfterPlanting = Math.max(1, Math.round(stageIndex * quarter + quarter / 2));

            // The ML model requires a light_intensity feature but there's
            // no real light sensor — sending the fabricated MQTT/simulated
            // value would let it silently skew a real prediction. Assume
            // the crop stage's own target midpoint instead: a neutral,
            // documented assumption rather than an arbitrary noisy number.
            const assumedLightIntensity =
              (stageData.light_intensity.min + stageData.light_intensity.max) / 2;

            const mlPayload = {
              crop_type: selectedCropId,
              hydroponic_method: selectedCrop.suitable_methods[0],
              growth_stage: selectedStage,
              ph: snapshot.reading.ph,
              ec: snapshot.reading.ec,
              water_temperature: snapshot.reading.water_temp,
              air_temperature: snapshot.reading.air_temp,
              humidity: snapshot.reading.humidity,
              water_level: snapshot.reading.water_level,
              light_intensity: assumedLightIntensity,
              light_hours: stageData.light_hours,
              days_after_planting: daysAfterPlanting,
            };
            const prediction = await postRecommendAction(mlPayload);
            if (!cancelled) {
              setMlPrediction(prediction);
              setMlError(null);
            }
          } catch {
            if (!cancelled) setMlError(t("monitoring.aiPredictionUnavailable"));
          } finally {
            if (!cancelled) setMlLoading(false);
          }
        }
      }
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedCropId, selectedStage, crops, selectedCrop, t]);

  if (loading) return <LoadingBlock label={t("common.loading")} />;
  if (loadError) return <ErrorBlock message={loadError} />;

  return (
    <div>
      <p className="section-sub">
        {t("monitoring.intro", {
          seconds: POLL_INTERVAL_MS / 1000,
          stage: t(`common.stages.${selectedStage}`),
        })}
      </p>

      <div className="flex items-center gap-8 wrap" style={{ marginBottom: 12 }}>
        <span className={`badge ${allSensorsLive ? "badge-good" : "badge-neutral"}`}>
          {allSensorsLive ? `🟢 ${t("common.status.connected")}` : `⚪ ${t("common.status.notConnected")}`}
        </span>
        {freshestUpdate && (
          <span className="text-muted" style={{ fontSize: 11.5 }}>
            {t("overview.lastUpdate")}: {new Date(freshestUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="card flex items-center justify-between wrap gap-16" style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-8 wrap">
          {crops.map((c) => (
            <button
              key={c.id}
              className="btn btn-sm"
              style={
                c.id === selectedCropId
                  ? { background: "var(--brand-blue)", color: "#fff", borderColor: "var(--brand-blue)" }
                  : {}
              }
              onClick={() => setSelectedCropId(c.id)}
            >
              {c.icon} {t(`common.cropNames.${c.id}`, c.name)}
            </button>
          ))}
        </div>
        <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)} className="btn btn-sm">
          {stages.map((s) => (
            <option key={s} value={s}>
              {t(`common.stages.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {connError && <ErrorBlock message={connError} />}

      <div className="grid grid-cols-4">
        {readings.map((r) => (
          <SensorDeviceCard
            key={r.type}
            name={t(`sensors.names.${r.type}`)}
            connectionState={r.connectionState}
            value={r.formattedValue}
            unit={r.unit}
            lastUpdate={r.lastUpdate}
            lastUpdateLabel={t("sensors.lastUpdate")}
          />
        ))}
      </div>

      <div className="mt-16">
        <SensorTrendChart history={history} />
      </div>

      <div className="grid grid-cols-2 mt-16" style={{ alignItems: "start" }}>
        <IssuesPanel
          issues={issues}
          overallStatus={overallStatus}
          analyzing={analyzing && issues.length === 0}
          unavailable={issuesUnavailable}
        />
        <MLPredictionPanel prediction={mlPrediction} loading={mlLoading && !mlPrediction} error={mlError} />
      </div>

      <div className="mt-16">
        <SensorDiagnosticsPanel />
      </div>

      {selectedCrop && (
        <div className="mt-16">
          <GrowthStageEnergyPanel />
        </div>
      )}
    </div>
  );
}
