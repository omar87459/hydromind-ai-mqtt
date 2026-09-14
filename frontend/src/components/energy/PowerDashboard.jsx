import { useTranslation } from "react-i18next";
import PumpPowerCard from "./PumpPowerCard";

// Real WCMCU-3221 power monitoring for the two connected pump relays.
// Distinct from the simulated whole-farm energy suite further down this
// page — this section only ever shows numbers the ESP32 actually measured.
export default function PowerDashboard({ mqttData }) {
  const { t } = useTranslation();

  const power = mqttData?.powerMonitoring;
  const connectionState = power ? "connected" : "offline";

  const mainRunning = Boolean(mqttData?.mainPump);
  const refillRunning = Boolean(mqttData?.refillPump ?? mqttData?.phPump);

  return (
    <div>
      <div className="card-title-row">
        <h3>{t("energy.powerDashboard.title")}</h3>
      </div>
      <p className="text-secondary" style={{ fontSize: 12.5, margin: "0 0 12px" }}>
        {t("energy.powerDashboard.subtitle")}
      </p>

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

      <div className="card mt-12" style={{ borderStyle: "dashed" }}>
        <p className="text-muted" style={{ fontSize: 11.5, margin: 0 }}>
          {t("energy.powerDashboard.futureNote")}
        </p>
      </div>
    </div>
  );
}
