import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchMqttData, fetchIotPumps, postIotControl } from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import Tabs from "../components/common/Tabs";
import PowerDashboard from "../components/energy/PowerDashboard";
import PlaceholderPowerCard from "../components/energy/PlaceholderPowerCard";
import DeviceEnergyConsumptionSection from "../components/energy/DeviceEnergyConsumptionSection";
import RealDeviceControlCard from "../components/automation/RealDeviceControlCard";
import NotConnectedDeviceCard from "../components/automation/NotConnectedDeviceCard";
import RequireAdmin from "../components/common/RequireAdmin";
import { REAL_CONTROLLABLE_PUMPS, NOT_YET_CONNECTED_DEVICES } from "../utils/hardwareStatus";

const POLL_INTERVAL_MS = 3000;

const DEFAULT_PUMPS = {
  mainPump: { pump: "mainPump", state: false, source: "default" },
  phPump: { pump: "phPump", state: false, source: "default" },
};

const powerPlaceholders = NOT_YET_CONNECTED_DEVICES.filter((d) => d.contexts.includes("power"));
const controlPlaceholders = NOT_YET_CONNECTED_DEVICES.filter((d) => d.contexts.includes("control"));

const TABS = [
  { id: "power", labelKey: "energy.tabs.power" },
  { id: "consumption", labelKey: "energy.tabs.consumption" },
  { id: "smartControl", labelKey: "energy.tabs.smartControl" },
];

export default function EnergyDashboardPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("power");
  const [mqttData, setMqttData] = useState(null);
  const [pumps, setPumps] = useState(DEFAULT_PUMPS);
  const [pending, setPending] = useState({});
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function tick() {
      try {
        const [mqtt, { pumps: latest }] = await Promise.all([fetchMqttData(), fetchIotPumps()]);
        if (cancelledRef.current) return;
        setMqttData(mqtt);
        setPumps((prev) => ({ ...prev, ...latest }));
        setError(null);
      } catch (err) {
        if (!cancelledRef.current) setError(err.message || "Could not reach the backend.");
      }
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, []);

  async function handleToggle(pumpKey, state, pwd) {
    setPending((prev) => ({ ...prev, [pumpKey]: true }));
    try {
      const record = await postIotControl(pumpKey, state, pwd);
      setPumps((prev) => ({ ...prev, [pumpKey]: record }));
    } catch (err) {
      alert(err.response?.status === 403 ? t("automation.wrongPassword") : t("automation.controlFailed"));
    } finally {
      setPending((prev) => ({ ...prev, [pumpKey]: false }));
    }
  }

  if (!mqttData && !error) return <LoadingBlock label={t("common.loading")} />;

  return (
    <div>
      <p className="section-sub">{t("energy.intro")}</p>

      {error && <ErrorBlock message={error} />}

      <Tabs tabs={TABS.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }))} activeId={activeTab} onChange={setActiveTab} />

      {activeTab === "power" && (
        <div>
          <PowerDashboard mqttData={mqttData} />
          <div className="grid grid-cols-2 gap-12 mt-12">
            {powerPlaceholders.map((device) => (
              <PlaceholderPowerCard key={device.id} title={t(device.nameKey)} />
            ))}
          </div>
        </div>
      )}

      {activeTab === "consumption" && <DeviceEnergyConsumptionSection />}

      {activeTab === "smartControl" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t("energy.smartControl.aiAutomation")}</div>
                <p className="text-muted" style={{ fontSize: 11.5, margin: "4px 0 0" }}>
                  {t("energy.smartControl.aiAutomationNote")}
                </p>
              </div>
              <button className="toggle" disabled title={t("energy.smartControl.aiAutomationNote")} />
            </div>
          </div>

          <RequireAdmin
            fallback={
              <div className="card" style={{ marginBottom: 16 }}>
                <p className="text-secondary" style={{ fontSize: 12.5, margin: 0 }}>
                  {t("automation.viewerNote")}
                </p>
              </div>
            }
          >
            <div className="card" style={{ marginBottom: 16 }}>
              <label className="text-muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                {t("pumpControl.title")} — {t("auth.password")}
              </label>
              <input
                type="password"
                className="input"
                style={{ maxWidth: 280 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </RequireAdmin>

          <div className="grid grid-cols-2 gap-12">
            {REAL_CONTROLLABLE_PUMPS.map(({ key, nameKey }) => (
              <div className="card" key={key}>
                <RealDeviceControlCard
                  nameKey={nameKey}
                  pump={pumps[key]}
                  pending={pending[key]}
                  password={password}
                  onToggle={(state, pwd) => handleToggle(key, state, pwd)}
                />
              </div>
            ))}
            {controlPlaceholders.map((device) => (
              <div className="card" key={device.id}>
                <NotConnectedDeviceCard nameKey={device.nameKey} brightness={device.brightness} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
