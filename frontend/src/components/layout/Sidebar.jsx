import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Sprout, TrendingUp, Activity, SlidersHorizontal, MessageCircle, Zap, Wifi, X } from "lucide-react";

// Overview is a separate home/dashboard entry, not one of the seven
// approved pages below. Methods/AI Model Lab/Farm Network/System
// Architecture keep their working routes (see App.jsx) but are
// intentionally left out of this nav.
const NAV_ITEMS = [
  { to: "/", key: "overview", icon: LayoutDashboard, end: true },
  { to: "/crops", key: "crops", icon: Sprout },
  { to: "/growth", key: "growth", icon: TrendingUp },
  { to: "/monitoring", key: "monitoring", icon: Activity },
  { to: "/automation", key: "automation", icon: SlidersHorizontal },
  { to: "/assistant", key: "assistant", icon: MessageCircle },
  { to: "/energy", key: "energy", icon: Zap },
  { to: "/sensors", key: "sensors", icon: Wifi },
];

export default function Sidebar({ open, onClose }) {
  const { t } = useTranslation();

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">🌱</div>
        <div className="sidebar-brand-text">
          <div className="name">{t("nav.brandName")}</div>
          <div className="tag">{t("nav.brandTag")}</div>
        </div>
        <button
          className="menu-toggle btn btn-sm"
          style={{ marginInlineStart: "auto" }}
          onClick={onClose}
          aria-label={t("nav.closeMenu")}
        >
          <X size={16} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon className="icon" size={16} />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        {t("nav.footerLine1")}
        <br />
        {t("nav.footerLine2")}
      </div>
    </aside>
  );
}
