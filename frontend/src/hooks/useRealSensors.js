import { useEffect, useRef, useState } from "react";
import { fetchIotSensors } from "../api";
import { REAL_SENSOR_TYPES, isSensorLive } from "../utils/hardwareStatus";

const POLL_INTERVAL_MS = 2500;

function formatNumber(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return null;
  return Number(n).toFixed(digits);
}

// Single shared source for "what are the 7 real sensors doing right now" —
// used by both the Overview snapshot and the Live Monitoring page, so
// there's exactly one implementation of "is this reading real" instead of
// two that can drift apart. Never returns a fabricated value: a sensor
// the ESP32 hasn't reported gets `value: null`, not a placeholder number.
export function useRealSensors() {
  const [sensors, setSensors] = useState(null);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function tick() {
      try {
        const { sensors: latest } = await fetchIotSensors();
        if (cancelledRef.current) return;
        setSensors(latest);
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

  const byType = {};
  (sensors || []).forEach((s) => (byType[s.sensor_type] = s));

  const readings = REAL_SENSOR_TYPES.map((type) => {
    const sensor = byType[type];
    const isLive = isSensorLive(sensor);

    return {
      type,
      isLive,
      connectionState: isLive ? "connected" : "not_connected",
      value: isLive ? sensor.reading : null,
      formattedValue: isLive ? formatNumber(sensor.reading, type === "water_level" ? 0 : 2) : null,
      unit: sensor?.unit,
      lastUpdate: isLive ? sensor.last_update : null,
    };
  });

  const freshestUpdate =
    readings
      .filter((r) => r.isLive && r.lastUpdate)
      .map((r) => r.lastUpdate)
      .sort()
      .pop() || null;

  const allLive = readings.every((r) => r.isLive);
  const anyLive = readings.some((r) => r.isLive);

  return { readings, loading: sensors === null, error, freshestUpdate, allLive, anyLive };
}
