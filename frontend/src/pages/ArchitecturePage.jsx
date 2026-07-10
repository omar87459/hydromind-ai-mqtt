import { useTranslation, Trans } from "react-i18next";
import { Info } from "lucide-react";
import ArchitectureDiagram from "../components/architecture/ArchitectureDiagram";

export default function ArchitecturePage() {
  const { t } = useTranslation();
  return (
    <div>
      <p className="section-sub">{t("architecture.intro")}</p>

      <ArchitectureDiagram />

      <div className="card mt-16" style={{ borderColor: "var(--brand-blue)" }}>
        <div className="flex items-center gap-8" style={{ color: "var(--brand-blue)", fontWeight: 700, fontSize: 13.5 }}>
          <Info size={16} />
          {t("architecture.noticeTitle")}
        </div>
        <p className="text-secondary mt-8" style={{ fontSize: 13, lineHeight: 1.6 }}>
          <Trans i18nKey="architecture.noticeBody">
            This diagram illustrates the intended production architecture. In this hackathon
            prototype, sensor data is simulated locally and the "cloud" and "satellite" layers are{" "}
            <strong>not actually implemented</strong> — there is no real satellite hardware or
            communication link. The idea is to show how HydroMind AI would scale to real farms,
            including remote locations with unreliable internet, where a local farm server keeps
            monitoring and automation running independently and relays only critical alerts over a
            low-bandwidth satellite channel when needed.
          </Trans>
        </p>
      </div>

      <div className="grid grid-cols-3 mt-16">
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>{t("architecture.whyLocalTitle")}</h3>
          <p className="text-secondary" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            {t("architecture.whyLocalBody")}
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>{t("architecture.whyCloudTitle")}</h3>
          <p className="text-secondary" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            {t("architecture.whyCloudBody")}
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>{t("architecture.whySatelliteTitle")}</h3>
          <p className="text-secondary" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            {t("architecture.whySatelliteBody")}
          </p>
        </div>
      </div>
    </div>
  );
}
