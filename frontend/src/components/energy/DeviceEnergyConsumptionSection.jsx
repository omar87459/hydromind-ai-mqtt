import { useTranslation } from "react-i18next";
import { REAL_CONTROLLABLE_PUMPS, NOT_YET_CONNECTED_DEVICES } from "../../utils/hardwareStatus";

// phUpPump is real for control now (see REAL_CONTROLLABLE_PUMPS below) but
// still listed here for "consumption" (its power monitoring isn't wired) -
// exclude it here so it doesn't render twice.
const consumptionDevices = NOT_YET_CONNECTED_DEVICES.filter(
  (d) => d.contexts.includes("consumption") && !REAL_CONTROLLABLE_PUMPS.some((p) => p.key === d.id)
);

// No backend history endpoint exists for energy consumption over time —
// not for the real, controllable devices, and not for anything else. Every
// cell here is a static placeholder; there is nothing real to fetch, so
// this section intentionally makes no API call.
export default function DeviceEnergyConsumptionSection() {
  const { t } = useTranslation();

  const rows = [
    ...REAL_CONTROLLABLE_PUMPS.map((p) => ({ id: p.key, nameKey: p.nameKey })),
    ...consumptionDevices.map((d) => ({ id: d.id, nameKey: d.nameKey })),
  ];

  return (
    <div className="card">
      <div className="card-title-row">
        <h3>{t("energy.consumption.title")}</h3>
      </div>
      <p className="text-secondary" style={{ fontSize: 12.5, margin: "0 0 12px" }}>
        {t("energy.consumption.subtitle")}
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 11.5 }}>
              <th style={{ padding: "6px 8px" }}>{t("energy.consumption.device")}</th>
              <th style={{ padding: "6px 8px" }}>{t("energy.consumption.today")}</th>
              <th style={{ padding: "6px 8px" }}>{t("energy.consumption.week")}</th>
              <th style={{ padding: "6px 8px" }}>{t("energy.consumption.month")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px dashed var(--gridline)" }}>
                <td style={{ padding: "8px", fontWeight: 600 }}>{t(row.nameKey)}</td>
                <td style={{ padding: "8px", color: "var(--text-muted)" }}>—</td>
                <td style={{ padding: "8px", color: "var(--text-muted)" }}>—</td>
                <td style={{ padding: "8px", color: "var(--text-muted)" }}>—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted mt-16" style={{ fontSize: 11.5, margin: "16px 0 0" }}>
        {t("energy.consumption.note")}
      </p>
    </div>
  );
}
