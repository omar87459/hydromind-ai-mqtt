import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Activity, SlidersHorizontal, Zap, MessageCircle, Satellite, X } from "lucide-react";

// Crops/Methods/Growth Stages/AI Model Lab/Farm Network keep their working
// routes (see App.jsx) but are intentionally left out of primary nav — the
// platform's nav is scoped to these 6 pages.
const NAV_ITEMS = [
  { to: "/", key: "overview", icon: LayoutDashboard, end: true },
  { to: "/monitoring", key: "monitoring", icon: Activity },
  { to: "/automation", key: "automation", icon: SlidersHorizontal },
  { to: "/energy", key: "energy", icon: Zap },
  { to: "/assistant", key: "assistant", icon: MessageCircle },
  { to: "/architecture", key: "architecture", icon: Satellite },
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
