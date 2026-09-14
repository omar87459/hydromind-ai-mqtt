import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchIotPumps, postIotControl } from "../api";
import { REAL_CONTROLLABLE_PUMPS, NOT_YET_CONNECTED_DEVICES } from "../utils/hardwareStatus";
import ConnectionBadge from "../components/common/ConnectionBadge";
import Collapsible from "../components/common/Collapsible";
import RealDeviceControlCard from "../components/automation/RealDeviceControlCard";
import NotConnectedDeviceCard from "../components/automation/NotConnectedDeviceCard";
import RequireAdmin from "../components/common/RequireAdmin";

const PUMP_POLL_INTERVAL_MS = 3000;

const DEFAULT_PUMPS = {
  mainPump: { pump: "mainPump", state: false, source: "default" },
  phPump: { pump: "phPump", state: false, source: "default" },
};

const placeholderDevices = NOT_YET_CONNECTED_DEVICES.filter((d) => d.contexts.includes("control"));

export default function AutomationControlPage() {
  const { t } = useTranslation();
  const [pumps, setPumps] = useState(DEFAULT_PUMPS);
  const [pending, setPending] = useState({});
  const [password, setPassword] = useState("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function tick() {
      try {
        const { pumps: latest } = await fetchIotPumps();
        if (!cancelledRef.current) setPumps((prev) => ({ ...prev, ...latest }));
      } catch {
        // Best-effort poll; nothing else on this page depends on it succeeding.
      }
    }

    tick();
    const interval = setInterval(tick, PUMP_POLL_INTERVAL_MS);
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

  return (
    <div>
      <p className="section-sub">{t("automation.intro")}</p>

      <RequireAdmin
        fallback={
          <div className="card mt-8" style={{ marginBottom: 16 }}>
            <p className="text-secondary" style={{ fontSize: 12.5, margin: 0 }}>
              {t("automation.viewerNote")}
            </p>
          </div>
        }
      >
        <div className="card mt-8" style={{ marginBottom: 16 }}>
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

      <div className="flex flex-col gap-12">
        {REAL_CONTROLLABLE_PUMPS.map(({ key, nameKey }) => {
          const pump = pumps[key];
          return (
            <Collapsible
              key={key}
              title={t(nameKey)}
              badge={<ConnectionBadge state={pump?.source === "esp32" ? "connected" : "not_connected"} small />}
            >
              <RealDeviceControlCard
                nameKey={nameKey}
                pump={pump}
                pending={pending[key]}
                password={password}
                onToggle={(state, pwd) => handleToggle(key, state, pwd)}
              />
            </Collapsible>
          );
        })}

        {placeholderDevices.map((device) => (
          <Collapsible key={device.id} title={t(device.nameKey)} badge={<ConnectionBadge state="not_connected" small />}>
            <NotConnectedDeviceCard nameKey={device.nameKey} brightness={device.brightness} />
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
