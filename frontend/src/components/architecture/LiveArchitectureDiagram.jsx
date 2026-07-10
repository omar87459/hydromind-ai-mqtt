import { useTranslation } from "react-i18next";
import { Radio, Cpu, Server, Wifi, Cloud, Monitor, ArrowRight } from "lucide-react";

const NODE_ORDER = ["sensor_network", "esp32", "gateway", "internet", "cloud", "dashboard"];

const NODE_ICON = {
  sensor_network: Radio,
  esp32: Cpu,
  gateway: Server,
  internet: Wifi,
  cloud: Cloud,
  dashboard: Monitor,
};

const STATUS_DOT = { online: "🟢", weak: "🟡", offline: "🔴" };
const STATUS_BADGE = { online: "badge-good", weak: "badge-warning", offline: "badge-critical" };
const STATUS_KEY = { online: "connected", weak: "weakSignal", offline: "offline" };

export default function LiveArchitectureDiagram({ nodes }) {
  const { t } = useTranslation();
  const statusByNode = Object.fromEntries((nodes || []).map((n) => [n.id, n.status]));

  return (
    <div className="card">
      <div className="flex items-stretch wrap gap-8" style={{ alignItems: "stretch" }}>
        {NODE_ORDER.map((nodeId, i) => {
          const Icon = NODE_ICON[nodeId];
          const status = statusByNode[nodeId] || "online";
          return (
            <div key={nodeId} className="flex items-center" style={{ flex: "1 1 170px" }}>
              <div
                className="card"
                style={{ flex: 1, background: "var(--page-plane)", textAlign: "center", minWidth: 140 }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    margin: "0 auto 10px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--brand-blue), var(--brand-aqua))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  {t(`farmNetwork.nodes.${nodeId}.title`)}
                </div>
                <span className={`badge ${STATUS_BADGE[status]}`} style={{ marginBottom: 8 }}>
                  {STATUS_DOT[status]} {t(`common.status.${STATUS_KEY[status]}`)}
                </span>
                <div className="text-muted" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                  {t(`farmNetwork.nodes.${nodeId}.desc`)}
                </div>
              </div>
              {i < NODE_ORDER.length - 1 && (
                <ArrowRight size={18} color="var(--text-muted)" className="rtl-flip" style={{ flexShrink: 0, margin: "0 4px" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
