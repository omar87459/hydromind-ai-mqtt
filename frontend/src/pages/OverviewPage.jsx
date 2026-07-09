import { Link } from "react-router-dom";
import { Sprout, Droplets, TrendingUp, Activity, MessageCircle, Satellite, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";

const QUICK_LINKS = [
  {
    to: "/crops",
    icon: Sprout,
    title: "Crop Database",
    desc: "Requirements for lettuce, basil, tomato, cucumber, and barley fodder.",
  },
  {
    to: "/methods",
    icon: Droplets,
    title: "Hydroponic Methods",
    desc: "DWC, NFT, Ebb & Flow, Drip, Aeroponics, and Vertical Farming compared.",
  },
  {
    to: "/growth",
    icon: TrendingUp,
    title: "Growth Stages",
    desc: "Seedling through harvest, with targets that update per crop and stage.",
  },
  {
    to: "/monitoring",
    icon: Activity,
    title: "Live Monitoring & Automation",
    desc: "Simulated IoT sensors, AI decision engine, and control panel.",
  },
  {
    to: "/assistant",
    icon: MessageCircle,
    title: "AI Knowledge Assistant",
    desc: "Ask hydroponic questions, answered from a local knowledge base.",
  },
  {
    to: "/architecture",
    icon: Satellite,
    title: "System Architecture",
    desc: "Farm sensors to satellite-backed cloud — the scale-up concept.",
  },
];

export default function OverviewPage() {
  const { crops, methods, loading, loadError } = useApp();

  if (loading) return <LoadingBlock label="Loading HydroMind AI..." />;
  if (loadError) return <ErrorBlock message={loadError} />;

  return (
    <div>
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(42,120,214,0.12), rgba(27,175,122,0.10))",
          borderColor: "var(--brand-blue)",
        }}
      >
        <div className="badge badge-blue">AI-Powered Smart Agriculture</div>
        <h2 style={{ margin: "10px 0 6px", fontSize: 24 }}>Welcome to HydroMind AI</h2>
        <p className="text-secondary" style={{ fontSize: 13.5, maxWidth: 640, lineHeight: 1.6 }}>
          Select a hydroponic method, choose a crop, monitor live sensor readings, and get
          AI-generated recommendations to keep every growth stage on target.
        </p>
      </div>

      <div className="grid grid-cols-4 mt-16">
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            Crops in Database
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{crops.length}</div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            Hydroponic Methods
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{methods.length}</div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            Monitored Parameters
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>7</div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            Farm Server
          </div>
          <div className="flex items-center gap-8 mt-8">
            <span className="pulse-dot" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--status-good)" }}>Online</span>
          </div>
        </div>
      </div>

      <h3 className="mt-24" style={{ marginBottom: 4 }}>
        Explore the Platform
      </h3>
      <div className="grid grid-cols-3 mt-16">
        {QUICK_LINKS.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to} className="card selectable" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="flex items-center gap-12">
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--status-good-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand-aqua)",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
            </div>
            <p className="text-secondary mt-8" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              {desc}
            </p>
            <div className="flex items-center gap-6" style={{ fontSize: 12, color: "var(--brand-blue)", fontWeight: 600 }}>
              Open <ArrowRight size={13} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
