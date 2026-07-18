import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Layers, Power, Gauge, TrendingUp, DollarSign, Bot } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  fetchEnergyLive,
  fetchEnergyDevices,
  postEnergyDeviceControl,
  postEnergyMode,
  fetchEnergyRecommendations,
  fetchEnergySummary,
  fetchEnergyPredictions,
  fetchEnergyAlerts,
  fetchIotNetworkStatus,
} from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import LiveMetricsGrid from "../components/energy/LiveMetricsGrid";
import DeviceEnergyCard from "../components/energy/DeviceEnergyCard";
import OptimizationPanel from "../components/energy/OptimizationPanel";
import SavingsSummary from "../components/energy/SavingsSummary";
import HistoricalCharts from "../components/energy/HistoricalCharts";
import PredictionPanel from "../components/energy/PredictionPanel";
import GrowthStageEnergyPanel from "../components/energy/GrowthStageEnergyPanel";
import AlertsPanel from "../components/energy/AlertsPanel";
import ReportsPanel from "../components/energy/ReportsPanel";
import SmartControlsPanel from "../components/energy/SmartControlsPanel";
import LiveArchitectureDiagram from "../components/architecture/LiveArchitectureDiagram";

const FAST_POLL_MS = 3000;
const SLOW_POLL_MS = 8000;

export default function EnergyDashboardPage() {
  const { t } = useTranslation();
  const { selectedCropId, selectedStage } = useApp();

  const [live, setLive] = useState(null);
  const [devices, setDevices] = useState(null);
  const [mode, setMode] = useState("auto");
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [equipmentRisks, setEquipmentRisks] = useState([]);
  const [networkNodes, setNetworkNodes] = useState(null);
  const [error, setError] = useState(null);

  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function fastTick() {
      try {
        const [liveData, deviceData] = await Promise.all([fetchEnergyLive(), fetchEnergyDevices()]);
        if (cancelledRef.current) return;
        setLive(liveData);
        setDevices(deviceData.devices);
        setMode(deviceData.mode);
        setError(null);
      } catch (err) {
        if (!cancelledRef.current) setError(err.message || "Could not reach the backend.");
      }
    }

    async function slowTick() {
      try {
        const [recData, summaryData, predictionData, alertsData, networkData] = await Promise.all([
          fetchEnergyRecommendations(selectedCropId, selectedStage),
          fetchEnergySummary(),
          fetchEnergyPredictions(selectedStage),
          fetchEnergyAlerts(),
          fetchIotNetworkStatus(),
        ]);
        if (cancelledRef.current) return;
        setRecommendations(recData.recommendations);
        setSummary(summaryData);
        setPredictions(predictionData);
        setAlerts(alertsData.alerts);
        setEquipmentRisks(alertsData.equipment_risks);
        setNetworkNodes(networkData.nodes);
      } catch (err) {
        if (!cancelledRef.current) setError(err.message || "Could not reach the backend.");
      }
    }

    fastTick();
    slowTick();
    const fastInterval = setInterval(fastTick, FAST_POLL_MS);
    const slowInterval = setInterval(slowTick, SLOW_POLL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(fastInterval);
      clearInterval(slowInterval);
    };
  }, [selectedCropId, selectedStage]);

  async function handleToggleDevice(deviceId, isOn) {
    try {
      const updated = await postEnergyDeviceControl(deviceId, { is_on: isOn });
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, ...updated } : d)));
    } catch (err) {
      setError(err.message || "Could not control device.");
    }
  }

  async function handleBrightnessChange(deviceId, brightnessPct) {
    try {
      const updated = await postEnergyDeviceControl(deviceId, { brightness_pct: brightnessPct });
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, ...updated } : d)));
    } catch (err) {
      setError(err.message || "Could not adjust brightness.");
    }
  }

  async function handleModeChange(nextMode) {
    try {
      const result = await postEnergyMode(nextMode);
      setMode(result.mode);
    } catch (err) {
      setError(err.message || "Could not switch mode.");
    }
  }

  if (error && !live) return <ErrorBlock message={error} />;
  if (!live || !devices) return <LoadingBlock label={t("common.loading")} />;

  const activeDevices = devices.filter((d) => d.is_on).length;
  const avgDailyConsumption = devices.reduce((sum, d) => sum + d.daily_energy_kwh, 0);
  const statTiles = [
    { icon: Layers, label: t("energy.stats.totalDevices"), value: devices.length },
    { icon: Power, label: t("energy.stats.activeDevices"), value: activeDevices },
    { icon: Gauge, label: t("energy.stats.avgDailyConsumption"), value: `${avgDailyConsumption.toFixed(2)} kWh` },
    { icon: TrendingUp, label: t("energy.stats.efficiencyPct"), value: summary ? `${summary.efficiency_score_pct}%` : "--" },
    { icon: DollarSign, label: t("energy.stats.monthlySavings"), value: summary ? `${summary.monthly_energy_saved_kwh} kWh` : "--" },
    { icon: Bot, label: t("energy.stats.todaysAiDecisions"), value: recommendations.length + alerts.length },
  ];

  return (
    <div>
      {error && <ErrorBlock message={error} />}

      <div className="card-title-row">
        <h3>{t("energy.stats.title")}</h3>
      </div>
      <div className="grid grid-cols-3">
        {statTiles.map((tile) => (
          <div className="card" key={tile.label}>
            <div className="flex items-center gap-8 text-muted" style={{ fontSize: 12 }}>
              <tile.icon size={15} />
              {tile.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{tile.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-24">
        <div className="card-title-row">
          <h3>{t("energy.liveMetrics.title")}</h3>
        </div>
        <LiveMetricsGrid live={live} />
      </div>

      <div className="mt-24">
        <div className="card-title-row">
          <h3>{t("energy.devices.title")}</h3>
        </div>
        <div className="grid grid-cols-4">
          {devices.map((device) => (
            <DeviceEnergyCard key={device.id} device={device} />
          ))}
        </div>
      </div>

      <div className="mt-24">
        <OptimizationPanel recommendations={recommendations} />
      </div>

      <div className="mt-24">
        <SavingsSummary summary={summary} />
      </div>

      <div className="mt-24">
        <HistoricalCharts />
      </div>

      <div className="mt-24">
        <PredictionPanel predictions={predictions} />
      </div>

      <div className="mt-24">
        <GrowthStageEnergyPanel />
      </div>

      <div className="mt-24">
        <AlertsPanel alerts={alerts} equipmentRisks={equipmentRisks} />
      </div>

      <div className="mt-24">
        <div className="card-title-row">
          <h3>{t("energy.connectivity.title")}</h3>
        </div>
        {networkNodes ? <LiveArchitectureDiagram nodes={networkNodes} /> : <LoadingBlock label={t("common.loading")} />}
      </div>

      <div className="mt-24">
        <ReportsPanel />
      </div>

      <div className="mt-24">
        <SmartControlsPanel
          devices={devices}
          mode={mode}
          onToggleDevice={handleToggleDevice}
          onBrightnessChange={handleBrightnessChange}
          onModeChange={handleModeChange}
        />
      </div>
    </div>
  );
}
