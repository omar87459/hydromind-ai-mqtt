import { Cpu, Server, Cloud, Satellite, Monitor, ArrowRight } from "lucide-react";

const STAGES = [
  {
    icon: Cpu,
    title: "Farm Sensors",
    desc: "pH, EC, temperature, humidity, water level, and light sensors mounted throughout the grow system, plus actuators (pumps, dosing valves, fans, lights).",
  },
  {
    icon: Server,
    title: "Local Farm Server",
    desc: "An on-site device that polls sensors, runs the AI Decision Engine locally, and drives automation — keeps the farm operating even if connectivity drops.",
  },
  {
    icon: Cloud,
    title: "AI Cloud Platform",
    desc: "Aggregates data across farms, retrains and refines recommendation models, stores history, and powers the farmer dashboard and knowledge assistant.",
  },
  {
    icon: Satellite,
    title: "Satellite Communication Layer",
    desc: "In remote regions without stable internet, critical alerts and summarized data are relayed via satellite link when the primary connection is unavailable.",
  },
  {
    icon: Monitor,
    title: "Farmer Dashboard",
    desc: "The HydroMind AI web app — live monitoring, AI recommendations, and remote control, accessible from anywhere.",
  },
];

export default function ArchitectureDiagram() {
  return (
    <div className="card">
      <div
        className="flex items-stretch wrap gap-8"
        style={{ alignItems: "stretch" }}
      >
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <div key={stage.title} className="flex items-center" style={{ flex: "1 1 180px" }}>
              <div
                className="card"
                style={{
                  flex: 1,
                  background: "var(--page-plane)",
                  textAlign: "center",
                  minWidth: 150,
                }}
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
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{stage.title}</div>
                <div className="text-muted" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                  {stage.desc}
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRight
                  size={18}
                  color="var(--text-muted)"
                  style={{ flexShrink: 0, margin: "0 4px" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
