import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { fetchSensorData, postAnalyze, postRecommendAction, fetchIotPumps, postIotControl } from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import SensorGrid from "../components/monitoring/SensorGrid";
import SensorTrendChart from "../components/monitoring/SensorTrendChart";
import IssuesPanel from "../components/monitoring/IssuesPanel";
import MLPredictionPanel from "../components/monitoring/MLPredictionPanel";
import ControlPanel from "../components/automation/ControlPanel";
import PumpControlPanel from "../components/automation/PumpControlPanel";
import { deriveAutomationSuggestions } from "../utils/automation";

const POLL_INTERVAL_MS = 5000;
const PUMP_POLL_INTERVAL_MS = 3000;
const HISTORY_LIMIT = 15;

const DEFAULT_PUMPS = {
  mainPump: { pump: "mainPump", state: false, source: "default" },
  phPump: { pump: "phPump", state: false, source: "default" },
};

const DEFAULT_DEVICE_STATES = {
  main_pump: true,
  nutrient_pump: false,
  ph_pump: false,
  grow_lights: true,
  cooling_fan: false,
};

export default function MonitoringPage() {
  const { t } = useTranslation();
  const { crops, loading, loadError, stages, selectedCropId, setSelectedCropId, selectedStage, setSelectedStage } =
    useApp();

  const [reading, setReading] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [overallStatus, setOverallStatus] = useState("unknown");
  const [mode, setMode] = useState("simulation");
  const [liveParams, setLiveParams] = useState([]);
  const [issues, setIssues] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState([]);
  const [connError, setConnError] = useState(null);
  const [deviceStates, setDeviceStates] = useState(DEFAULT_DEVICE_STATES);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState(null);
  const [pumps, setPumps] = useState(DEFAULT_PUMPS);
  const [pumpPending, setPumpPending] = useState({});

  const tickRef = useRef(0);
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
        setReading(snapshot.reading);
        const statusMap = {};
        snapshot.statuses.forEach((s) => (statusMap[s.parameter] = s.status));
        setStatuses(statusMap);
        setOverallStatus(snapshot.overall_status);
        setMode(snapshot.mode || "simulation");
        setLiveParams(snapshot.live_params || []);
        setConnError(null);

        tickRef.current += 1;
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

        const analysis = await postAnalyze(selectedCropId, selectedStage, snapshot.reading);
        if (cancelled) return;
        setIssues(analysis.issues);
      } catch (err) {
        if (!cancelled) setConnError(err.message || "Could not reach the backend.");
      } finally {
        if (!cancelled) setAnalyzing(false);
      }

      if (selectedCrop && snapshot) {
        try {
          setMlLoading(true);
          const stageData = selectedCrop.stages[selectedStage];
          const stageIndex = Object.keys(selectedCrop.stages).indexOf(selectedStage);
          const avgCycle =
            (selectedCrop.growth_cycle_days.min + selectedCrop.growth_cycle_days.max) / 2;
          const quarter = avgCycle / 4;
          const daysAfterPlanting = Math.max(1, Math.round(stageIndex * quarter + quarter / 2));

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
            light_intensity: snapshot.reading.light_intensity,
            light_hours: stageData.light_hours,
            days_after_planting: daysAfterPlanting,
          };
          const prediction = await postRecommendAction(mlPayload);
          if (!cancelled) {
            setMlPrediction(prediction);
            setMlError(null);
          }
        } catch (err) {
          if (!cancelled) setMlError(err.message || "ML prediction failed.");
        } finally {
          if (!cancelled) setMlLoading(false);
        }
      }
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedCropId, selectedStage, crops]);

  useEffect(() => {
    let cancelled = false;

    async function pollPumps() {
      try {
        const { pumps: latest } = await fetchIotPumps();
        if (!cancelled) setPumps((prev) => ({ ...prev, ...latest }));
      } catch {
        // Pump status is best-effort; the sensor poll above already surfaces backend errors.
      }
    }

    pollPumps();
    const interval = setInterval(pollPumps, PUMP_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handlePumpToggle(
  pump,
  state,
  password
) {
  setPumpPending((prev) => ({
    ...prev,
    [pump]: true,
  }));

  try {
    const record = await postIotControl(
      pump,
      state,
      password
    );

    setPumps((prev) => ({
      ...prev,
      [pump]: record,
    }));

  } catch (err) {
    console.error(
      "Pump control failed:",
      err
    );


    if (err.message === "Wrong password") {
      alert("Wrong pump password");
    } else {
      alert("Pump control failed");
    }

    alert(
      "Wrong password or pump control failed"
    );


  } finally {
    setPumpPending((prev) => ({
      ...prev,
      [pump]: false,
    }));
  }
}

  if (loading) return <LoadingBlock label={t("common.loading")} />;
  if (loadError) return <ErrorBlock message={loadError} />;

  const statusMapForGrid = { ...statuses };
  const suggestions = deriveAutomationSuggestions(reading || {}, issues);

  return (
    <div>
      <p className="section-sub">
        {t("monitoring.intro", {
          seconds: POLL_INTERVAL_MS / 1000,
          stage: t(`common.stages.${selectedStage}`),
        })}
      </p>

      <div className="flex items-center gap-8 wrap" style={{ marginBottom: 12 }}>
        <span className={`badge ${mode === "simulation" ? "badge-warning" : "badge-good"}`}>
          {mode === "simulation"
            ? `🟡 ${t("sensors.simulationMode")}`
            : mode === "hybrid"
            ? `🟢 ${t("sensors.hybridDataMode")}`
            : `🟢 ${t("sensors.liveDataMode")}`}
        </span>
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
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="btn btn-sm"
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              {t(`common.stages.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {connError && <ErrorBlock message={connError} />}

      {reading && (
        <>
          <SensorGrid reading={reading} statusByParam={statusMapForGrid} liveParams={liveParams} />

          <div className="mt-16">
            <SensorTrendChart history={history} />
          </div>

          <div className="grid grid-cols-2 mt-16" style={{ alignItems: "start" }}>
            <IssuesPanel issues={issues} overallStatus={overallStatus} analyzing={analyzing && issues.length === 0} />
            <MLPredictionPanel prediction={mlPrediction} loading={mlLoading && !mlPrediction} error={mlError} />
          </div>

          <div className="mt-16">
            <PumpControlPanel pumps={pumps} pending={pumpPending} onToggle={handlePumpToggle} />
          </div>

          <div className="mt-16">
            <ControlPanel
              deviceStates={deviceStates}
              suggestions={suggestions}
              onToggle={(key, value) => setDeviceStates((prev) => ({ ...prev, [key]: value }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
