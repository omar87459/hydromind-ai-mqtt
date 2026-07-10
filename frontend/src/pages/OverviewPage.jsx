import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sprout, Droplets, TrendingUp, Activity, MessageCircle, Satellite, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";

const QUICK_LINKS = [
  { to: "/crops", icon: Sprout, key: "linkCrops" },
  { to: "/methods", icon: Droplets, key: "linkMethods" },
  { to: "/growth", icon: TrendingUp, key: "linkGrowth" },
  { to: "/monitoring", icon: Activity, key: "linkMonitoring" },
  { to: "/assistant", icon: MessageCircle, key: "linkAssistant" },
  { to: "/architecture", icon: Satellite, key: "linkArchitecture" },
];

export default function OverviewPage() {
  const { t } = useTranslation();
  const { crops, methods, loading, loadError } = useApp();

  if (loading) return <LoadingBlock label={t("common.loading")} />;
  if (loadError) return <ErrorBlock message={loadError} />;

  return (
    <div>
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(42,120,214,0.12), rgba(27,175,122,0.10))",
          borderColor: "var(--brand-blue)",
        }}
      >
        <div className="badge badge-blue">{t("overview.badge")}</div>
        <h2 style={{ margin: "10px 0 6px", fontSize: 24 }}>{t("overview.welcome")}</h2>
        <p className="text-secondary" style={{ fontSize: 13.5, maxWidth: 640, lineHeight: 1.6 }}>
          {t("overview.intro")}
        </p>
      </div>

      <div className="grid grid-cols-4 mt-16">
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            {t("overview.cropsInDatabase")}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{crops.length}</div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            {t("overview.hydroponicMethods")}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{methods.length}</div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            {t("overview.monitoredParameters")}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>7</div>
        </div>
        <div className="card">
          <div className="text-muted" style={{ fontSize: 12 }}>
            {t("overview.farmServer")}
          </div>
          <div className="flex items-center gap-8 mt-8">
            <span className="pulse-dot" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--status-good)" }}>
              {t("overview.online")}
            </span>
          </div>
        </div>
      </div>

      <h3 className="mt-24" style={{ marginBottom: 4 }}>
        {t("overview.explorePlatform")}
      </h3>
      <div className="grid grid-cols-3 mt-16">
        {QUICK_LINKS.map(({ to, icon: Icon, key }) => (
          <Link key={to} to={to} className="card selectable" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="flex items-center gap-12">
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--status-good-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand-aqua)",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t(`overview.${key}Title`)}</div>
            </div>
            <p className="text-secondary mt-8" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              {t(`overview.${key}Desc`)}
            </p>
            <div className="flex items-center gap-6" style={{ fontSize: 12, color: "var(--brand-blue)", fontWeight: 600 }}>
              {t("common.open")} <ArrowRight size={13} className="rtl-flip" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
