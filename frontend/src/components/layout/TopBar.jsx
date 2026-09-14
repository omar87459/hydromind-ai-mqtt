import { Menu, LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

export default function TopBar({ title, subtitle, onMenuClick }) {
  const { t } = useTranslation();
  const { connectionPhase } = useApp();
  const { user, logout } = useAuth();
  const serverOnline = connectionPhase === "ready";

  return (
    <header className="topbar">
      <div className="flex items-center gap-12">
        <button className="menu-toggle btn btn-sm" onClick={onMenuClick} aria-label={t("nav.openMenu")}>
          <Menu size={16} />
        </button>
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="topbar-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-12">
        <LanguageSwitcher />
        <div className={`badge ${serverOnline ? "badge-good" : "badge-critical"}`}>
          {serverOnline && <span className="pulse-dot" />}
          {serverOnline ? t("common.farmServerOnline") : t("common.status.offline")}
        </div>
        {user && (
          <div className="flex items-center gap-8">
            <span className="badge badge-neutral">
              <User size={11} />
              {user.username} · {t(`auth.role.${user.role}`)}
            </span>
            <button className="btn btn-sm" onClick={logout} aria-label={t("auth.logout")}>
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
