import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from "lucide-react";

const CONFIG = {
  ideal: { key: "ideal", className: "badge-good", Icon: CheckCircle2 },
  good: { key: "ideal", className: "badge-good", Icon: CheckCircle2 },
  warning: { key: "warning", className: "badge-warning", Icon: AlertTriangle },
  critical: { key: "critical", className: "badge-critical", Icon: AlertOctagon },
  unknown: { key: "noTargetSet", className: "badge-neutral", Icon: HelpCircle },
};

export default function StatusBadge({ status, small }) {
  const { t } = useTranslation();
  const cfg = CONFIG[status] || CONFIG.unknown;
  const { Icon } = cfg;
  return (
    <span className={`badge ${cfg.className}`}>
      <Icon size={small ? 11 : 12} />
      {t(`common.status.${cfg.key}`)}
    </span>
  );
}
