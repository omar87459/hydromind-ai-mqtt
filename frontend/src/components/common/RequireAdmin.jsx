import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Gates control elements (buttons, sliders, switches) behind the Admin
// role. Viewers still see the surrounding page/card — just a read-only
// note instead of working controls. Not for gating whole pages: Viewers
// are allowed to view the Automation and Energy pages, just not act on
// them.
export default function RequireAdmin({ children, fallback }) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  if (isAdmin) return children;

  return (
    fallback || (
      <div className="flex items-center gap-6 text-muted" style={{ fontSize: 11.5 }}>
        <Lock size={12} />
        {t("common.adminOnly")}
      </div>
    )
  );
}
