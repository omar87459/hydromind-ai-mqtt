import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, FileSpreadsheet, FileDown } from "lucide-react";
import { downloadEnergyReport } from "../../api";

const REPORT_TYPES = ["daily", "weekly", "monthly", "cost", "efficiency"];

export default function ReportsPanel() {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(null);

  async function handleDownload(reportType, format) {
    const key = `${reportType}-${format}`;
    setDownloading(key);
    try {
      await downloadEnergyReport(reportType, format);
    } catch (err) {
      console.error("Report download failed", err);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="card">
      <div className="card-title-row">
        <h3 className="flex items-center gap-8">
          <FileDown size={16} />
          {t("energy.reports.title")}
        </h3>
      </div>
      <p className="text-secondary" style={{ fontSize: 12.5, marginTop: 0 }}>
        {t("energy.reports.intro")}
      </p>

      <div className="grid grid-cols-3 mt-16">
        {REPORT_TYPES.map((reportType) => (
          <div className="card" key={reportType}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              {t(`energy.reports.${reportType}`)}
            </div>
            <div className="flex gap-8">
              <button
                className="btn btn-sm"
                onClick={() => handleDownload(reportType, "pdf")}
                disabled={downloading === `${reportType}-pdf`}
              >
                {downloading === `${reportType}-pdf` ? (
                  <span className="spinner" />
                ) : (
                  <FileText size={13} />
                )}
                PDF
              </button>
              <button
                className="btn btn-sm"
                onClick={() => handleDownload(reportType, "xlsx")}
                disabled={downloading === `${reportType}-xlsx`}
              >
                {downloading === `${reportType}-xlsx` ? (
                  <span className="spinner" />
                ) : (
                  <FileSpreadsheet size={13} />
                )}
                Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
