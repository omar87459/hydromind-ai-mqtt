import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from "lucide-react";

const CONFIG = {
  ideal: { label: "Ideal", className: "badge-good", Icon: CheckCircle2 },
  good: { label: "Ideal", className: "badge-good", Icon: CheckCircle2 },
  warning: { label: "Warning", className: "badge-warning", Icon: AlertTriangle },
  critical: { label: "Critical", className: "badge-critical", Icon: AlertOctagon },
  unknown: { label: "No target set", className: "badge-neutral", Icon: HelpCircle },
};

export default function StatusBadge({ status, small }) {
  const cfg = CONFIG[status] || CONFIG.unknown;
  const { Icon } = cfg;
  return (
    <span className={`badge ${cfg.className}`}>
      <Icon size={small ? 11 : 12} />
      {cfg.label}
    </span>
  );
}
