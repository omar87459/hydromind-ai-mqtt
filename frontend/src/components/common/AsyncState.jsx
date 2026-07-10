import { useTranslation } from "react-i18next";

export function LoadingBlock({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-8 text-muted" style={{ padding: "24px 0" }}>
      <span className="spinner" />
      {label || t("common.loading")}
    </div>
  );
}

export function ErrorBlock({ message }) {
  const { t } = useTranslation();
  return (
    <div className="card" style={{ borderColor: "var(--status-critical)" }}>
      <div className="flex items-center gap-8">
        <span className="badge badge-critical">{t("common.error")}</span>
        <span>{message || t("common.errorGeneric")}</span>
      </div>
      <p className="text-muted mt-8" style={{ fontSize: 12.5 }}>
        {t("common.errorBackendHint")}
      </p>
    </div>
  );
}
