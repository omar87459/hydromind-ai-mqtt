import { useEffect, useRef, useState } from "react";
import { fetchIotSensors, fetchMqttData } from "../api";
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
  const [ppfd, setPpfd] = useState(null);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function tick() {
      try {
        const [{ sensors: latest }, mqtt] = await Promise.all([fetchIotSensors(), fetchMqttData()]);
        if (cancelledRef.current) return;
        setSensors(latest);
        // ppfd isn't a tracked sensor_type in the backend's iot_registry
        // (that registry's fixed schema is untouched) - it rides through
        // GET /mqtt/data instead, which already passes any ESP32-sent
        // field through unmodified. Only ever a real value or null, never
        // a fabricated fallback.
        setPpfd(typeof mqtt?.ppfd === "number" && !Number.isNaN(mqtt.ppfd) ? mqtt.ppfd : null);
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
    const isLight = type === "light_intensity";
    const showPpfd = isLight && isLive && ppfd !== null;

    return {
      type,
      isLive,
      connectionState: isLive ? "connected" : "not_connected",
      value: isLive ? sensor.reading : null,
      formattedValue: isLive ? formatNumber(sensor.reading, type === "water_level" ? 0 : 2) : null,
      // BH1750 outputs lux. The backend's SENSOR_DEFS unit string for this
      // sensor_type is " µmol/m²/s" (a PPFD unit, not lux) - that registry
      // is left untouched, so the correct unit is applied here instead.
      unit: isLight ? " lux" : sensor?.unit,
      lastUpdate: isLive ? sensor.last_update : null,
      // Secondary, approximate PPFD value (see hhh.ino's lux->PPFD
      // conversion) shown alongside the real lux reading. Only ever
      // populated from a real "ppfd" field the ESP32 actually sent -
      // never shown if that field is absent.
      secondaryLabel: showPpfd ? "PPFD" : null,
      secondaryValue: showPpfd ? `${formatNumber(ppfd, 2)} µmol/m²/s` : null,
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
