import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function TopBar({ title, subtitle, onMenuClick }) {
  const { t } = useTranslation();

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
        <div className="badge badge-good">
          <span className="pulse-dot" />
          {t("common.farmServerOnline")}
        </div>
      </div>
    </header>
  );
}
