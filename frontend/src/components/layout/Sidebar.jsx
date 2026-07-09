import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Sprout,
  Droplets,
  TrendingUp,
  Activity,
  MessageCircle,
  Satellite,
  FlaskConical,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/crops", label: "Crop Database", icon: Sprout },
  { to: "/methods", label: "Hydroponic Methods", icon: Droplets },
  { to: "/growth", label: "Growth Stages", icon: TrendingUp },
  { to: "/monitoring", label: "Live Monitoring", icon: Activity },
  { to: "/assistant", label: "AI Knowledge Assistant", icon: MessageCircle },
  { to: "/model-lab", label: "AI Model Lab", icon: FlaskConical },
  { to: "/architecture", label: "System Architecture", icon: Satellite },
];

export default function Sidebar({ open, onClose }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">🌱</div>
        <div className="sidebar-brand-text">
          <div className="name">HydroMind AI</div>
          <div className="tag">Smart Hydroponic Platform</div>
        </div>
        <button
          className="menu-toggle btn btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon className="icon" size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        HydroMind AI · Hackathon Prototype
        <br />
        v0.1.0 — local dataset
      </div>
    </aside>
  );
}
