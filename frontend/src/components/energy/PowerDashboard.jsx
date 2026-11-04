import { useTranslation } from "react-i18next";
import PumpPowerCard from "./PumpPowerCard";

// Real WCMCU-3221 power monitoring for all five connected loads, across
// both INA3221 modules — this component only ever shows numbers the ESP32
// actually measured. The caller (EnergyDashboardPage) renders placeholder
// cards for devices with no WCMCU channel at all (grow light, the ESP32
// controller itself) alongside this.
//
// Each load's connectionState comes from its own powerMonitoring.<key>.connected
// flag (module #1's wcmcu1.isConnected() for mainPump/refillPump, module
// #2's wcmcu2.isConnected() for phDownPump/phUpPump/nutrientPumpAB) — never
// from whether the pump happens to be running. A load that is legitimately
// OFF still reports connected=true with 0/0/0; a load whose INA3221 module
// didn't respond on its I2C bus reports connected=false regardless of
// whether its pump is on or off. Sensor connectivity and pump operating
// state are deliberately two separate signals, never conflated.
const LOADS = [
  { key: "mainPump", titleKey: "energy.powerDashboard.mainPump", runningKey: "mainPump" },
  { key: "refillPump", titleKey: "energy.powerDashboard.refillPump", runningKeys: ["refillPump", "phPump"] },
  { key: "phDownPump", titleKey: "devices.phDownPump", runningKey: "phDownPump" },
  { key: "phUpPump", titleKey: "devices.phUpPump", runningKey: "phUpPump" },
  { key: "nutrientPumpAB", titleKey: "devices.nutrientPumpAB", runningKey: "nutrientPumpAB" },
];

export default function PowerDashboard({ mqttData }) {
  const { t } = useTranslation();

  const power = mqttData?.powerMonitoring;

  return (
    <div className="grid grid-cols-2 gap-12">
      {LOADS.map((load) => {
        const reading = power?.[load.key];

        const running = load.runningKeys
          ? Boolean(load.runningKeys.map((k) => mqttData?.[k]).find((v) => v !== undefined))
          : Boolean(mqttData?.[load.runningKey]);

        // "connected" is additive on the ESP32 side (older firmware
        // without it would leave this undefined) — fall back to the old
        // "does powerMonitoring exist at all" signal only in that case,
        // rather than silently showing every load as offline.
        const connectionState =
          reading?.connected !== undefined ? (reading.connected ? "connected" : "offline") : power ? "connected" : "offline";

        return (
          <PumpPowerCard
            key={load.key}
            title={t(load.titleKey)}
            power={reading}
            running={running}
            connectionState={connectionState}
          />
        );
      })}
    </div>
  );
}
