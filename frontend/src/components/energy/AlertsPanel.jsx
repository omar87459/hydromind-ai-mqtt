import { useTranslation } from "react-i18next";
import { Bell, ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

export default function AlertsPanel({ alerts, equipmentRisks }) {
  const { t } = useTranslation();
  const hasAlerts = alerts && alerts.length > 0;
  const hasRisks = equipmentRisks && equipmentRisks.length > 0;

  return (
    <div className="card">
      <div className="card-title-row">
        <h3 className="flex items-center gap-8">
          <Bell size={16} />
          {t("energy.alerts.title")}
        </h3>
      </div>

      {!hasAlerts && !hasRisks && (
        <div className="flex items-center gap-8 text-secondary" style={{ fontSize: 13, padding: "8px 0" }}>
          <ShieldCheck size={16} color="var(--status-good)" />
          {t("energy.alerts.empty")}
        </div>
      )}

      {hasAlerts && (
        <div className="flex flex-col gap-8 mt-8">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between"
              style={{
                fontSize: 12.5,
                padding: "8px 10px",
                borderRadius: 8,
                background: a.severity === "critical" ? "var(--status-critical-bg)" : "var(--status-warning-bg)",
              }}
            >
              <div className="flex items-center gap-8">
                {a.severity === "critical" ? (
                  <AlertOctagon size={14} color="var(--status-critical)" />
                ) : (
                  <AlertTriangle size={14} color="var(--status-warning)" />
                )}
                {a.message}
              </div>
              <StatusBadge status={a.severity} small />
            </div>
          ))}
        </div>
      )}

      {hasRisks && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 700, margin: "16px 0 8px" }}>
            {t("energy.alerts.equipmentRisksTitle")}
          </div>
          <div className="flex flex-col gap-8">
            {equipmentRisks.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-8"
                style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 8, background: "var(--status-warning-bg)" }}
              >
                <AlertTriangle size={14} color="var(--status-warning)" />
                {r.message}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
