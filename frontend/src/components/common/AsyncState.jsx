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

export function ConnectingBlock({ phase }) {
  const { t } = useTranslation();
  const label = phase === "loading-data" ? t("common.loadingData") : t("common.connectingTitle");

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "100vh", padding: 24 }}
    >
      <div className="card" style={{ maxWidth: 380, textAlign: "center", padding: 32 }}>
        <div className="flex items-center justify-center" style={{ marginBottom: 16 }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
        <p className="text-muted mt-8" style={{ fontSize: 12.5 }}>
          {t("common.connectingHint")}
        </p>
      </div>
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
