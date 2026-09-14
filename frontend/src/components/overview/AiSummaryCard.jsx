import { useTranslation } from "react-i18next";
import { Bot } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

export default function AiSummaryCard({ status, recommendation, loading, unavailable }) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="card-title-row">
        <h3 className="flex items-center gap-8">
          <Bot size={16} />
          {t("overview.aiSummaryTitle")}
        </h3>
        {loading ? <span className="spinner" /> : !unavailable && <StatusBadge status={status} />}
      </div>

      <p className="text-secondary" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
        {unavailable ? t("common.dataStatus.waitingForRealData") : recommendation}
      </p>
    </div>
  );
}
