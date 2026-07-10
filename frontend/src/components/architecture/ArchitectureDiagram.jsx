import { useTranslation } from "react-i18next";
import { Cpu, Server, Cloud, Satellite, Monitor, ArrowRight } from "lucide-react";

const STAGES = [
  { icon: Cpu, key: "sensors" },
  { icon: Server, key: "server" },
  { icon: Cloud, key: "cloud" },
  { icon: Satellite, key: "satellite" },
  { icon: Monitor, key: "dashboard" },
];

export default function ArchitectureDiagram() {
  const { t } = useTranslation();
  return (
    <div className="card">
      <div className="flex items-stretch wrap gap-8" style={{ alignItems: "stretch" }}>
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <div key={stage.key} className="flex items-center" style={{ flex: "1 1 180px" }}>
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
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  {t(`architecture.stages.${stage.key}.title`)}
                </div>
                <div className="text-muted" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                  {t(`architecture.stages.${stage.key}.desc`)}
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRight size={18} color="var(--text-muted)" className="rtl-flip" style={{ flexShrink: 0, margin: "0 4px" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
