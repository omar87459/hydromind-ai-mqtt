import { Menu } from "lucide-react";

export default function TopBar({ title, subtitle, onMenuClick }) {
  return (
    <header className="topbar">
      <div className="flex items-center gap-12">
        <button className="menu-toggle btn btn-sm" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={16} />
        </button>
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="topbar-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="badge badge-good">
        <span className="pulse-dot" />
        Farm Server Online
      </div>
    </header>
  );
}
