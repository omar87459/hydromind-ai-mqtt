import { useTranslation } from "react-i18next";
import PumpPowerCard from "./PumpPowerCard";

// Real WCMCU-3221 power monitoring for the two connected pump relays —
// this component only ever shows numbers the ESP32 actually measured.
// The caller (EnergyDashboardPage / MonitoringPage) renders placeholder
// cards for every device with no real power reading alongside this.
export default function PowerDashboard({ mqttData }) {
  const { t } = useTranslation();

  const power = mqttData?.powerMonitoring;
  const connectionState = power ? "connected" : "offline";

  const mainRunning = Boolean(mqttData?.mainPump);
  const refillRunning = Boolean(mqttData?.refillPump ?? mqttData?.phPump);

  return (
    <div className="grid grid-cols-2 gap-12">
      <PumpPowerCard
        title={t("energy.powerDashboard.mainPump")}
        power={power?.mainPump}
        running={mainRunning}
        connectionState={connectionState}
      />
      <PumpPowerCard
        title={t("energy.powerDashboard.refillPump")}
        power={power?.refillPump}
        running={refillRunning}
        connectionState={connectionState}
      />
    </div>
  );
}
