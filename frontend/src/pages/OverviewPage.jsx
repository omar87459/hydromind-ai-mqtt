import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { postAnalyze } from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import SensorDeviceCard from "../components/sensors/SensorDeviceCard";
import SystemStatusPanel from "../components/overview/SystemStatusPanel";
import AiSummaryCard from "../components/overview/AiSummaryCard";
import { useRealSensors } from "../hooks/useRealSensors";
import { REAL_SENSOR_TYPES, excludeNeverRealIssues, overallStatusFromIssues } from "../utils/hardwareStatus";

const AI_POLL_INTERVAL_MS = 5000;

export default function OverviewPage() {
  const { t } = useTranslation();
  const { loading, loadError, connectionPhase, selectedCropId, selectedStage } = useApp();
  const { readings, anyLive, freshestUpdate } = useRealSensors();

  const [aiStatus, setAiStatus] = useState("unknown");
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiUnavailable, setAiUnavailable] = useState(true);

  const byType = {};
  readings.forEach((r) => (byType[r.type] = r));
  const allRequiredLive = REAL_SENSOR_TYPES.every((type) => byType[type]?.isLive);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      // AI system must only analyze real sensor data — if any of the 6
      // real-capable fields hasn't been reported yet, don't call the
      // backend with a partially-fabricated reading.
      if (!allRequiredLive) {
        if (!cancelled) {
          setAiUnavailable(true);
          setAiLoading(false);
        }
        return;
      }

      const reading = {};
      REAL_SENSOR_TYPES.forEach((type) => (reading[type] = byType[type].value));
      // Required by the backend's SensorReading model but never real —
      // excludeNeverRealIssues/overallStatusFromIssues below strip any
      // issue this placeholder could otherwise generate.
      reading.light_intensity = 0;

      try {
        setAiLoading(true);
        const analysis = await postAnalyze(selectedCropId, selectedStage, reading);
        if (cancelled) return;
        const realIssues = excludeNeverRealIssues(analysis.issues);
        setAiStatus(overallStatusFromIssues(realIssues));
        setAiRecommendation(realIssues[0]?.recommended_action || t("overview.aiAllNormal"));
        setAiUnavailable(false);
      } catch {
        if (!cancelled) setAiUnavailable(true);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }

    tick();
    const interval = setInterval(tick, AI_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCropId, selectedStage, allRequiredLive]);

  if (loading) return <LoadingBlock label={t("common.loading")} />;
  if (loadError) return <ErrorBlock message={loadError} />;

  return (
    <div>
      <p className="section-sub">{t("overview.intro")}</p>

      <h3 style={{ marginBottom: 12 }}>{t("overview.systemStatusTitle")}</h3>
      <SystemStatusPanel
        serverOnline={connectionPhase === "ready"}
        esp32Connected={anyLive}
        lastUpdate={freshestUpdate}
      />

      <h3 className="mt-24" style={{ marginBottom: 12 }}>
        {t("overview.liveFarmSnapshotTitle")}
      </h3>
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

      <div className="mt-24">
        <AiSummaryCard
          status={aiStatus}
          recommendation={aiRecommendation}
          loading={aiLoading}
          unavailable={aiUnavailable}
        />
      </div>
    </div>
  );
}
