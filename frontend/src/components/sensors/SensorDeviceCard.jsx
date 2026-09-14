import { Clock } from "lucide-react";
import ConnectionBadge from "../common/ConnectionBadge";

function secondsAgo(isoTimestamp) {
  if (!isoTimestamp) return null;
  const diff = (Date.now() - new Date(isoTimestamp).getTime()) / 1000;
  if (diff < 60) return `${Math.max(0, Math.round(diff))}s`;
  return `${Math.round(diff / 60)}m`;
}

// Card for one sensor or device. `connectionState` is "connected",
// "not_connected" (no hardware installed yet), or "offline" (real
// hardware that's gone quiet) — the same shape either way, so the
// dashboard never has to fake a "connected" reading for hardware that
// isn't there.
export default function SensorDeviceCard({
  name,
  connectionState,
  value,
  unit,
  lastUpdate,
  lastUpdateLabel,
  note,
  lines,
}) {
  const ago = secondsAgo(lastUpdate);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
        <ConnectionBadge state={connectionState} />
      </div>

      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 10 }}>
        {value !== null && value !== undefined && value !== "" ? (
          <>
            {value}
            {unit && <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>{unit}</span>}
          </>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-muted)" }}>—</span>
        )}
      </div>

      {note && (
        <div className="text-muted mt-8" style={{ fontSize: 11.5, fontStyle: "italic" }}>
          {note}
        </div>
      )}

      {(lines || []).map((line) => (
        <div className="kv-row mt-8" key={line.label}>
          <span className="kv-label">{line.label}</span>
          <span className="kv-value">{line.value}</span>
        </div>
      ))}

      {ago && (
        <div className="kv-row mt-8">
          <span className="kv-label flex items-center gap-6">
            <Clock size={12} /> {lastUpdateLabel}
          </span>
          <span className="kv-value">{ago}</span>
        </div>
      )}
    </div>
  );
}
