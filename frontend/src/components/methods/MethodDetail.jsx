import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function MethodDetail({ method }) {
  const { t } = useTranslation();
  const { crops, setSelectedCropId } = useApp();
  const compatibleCrops = crops.filter((c) => c.suitable_methods.includes(method.id));
  const methodName = t(`common.methodNames.${method.id}`, method.name);

  return (
    <div>
      <div className="card-title-row">
        <h3>
          {method.icon} {methodName}
        </h3>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-8" style={{ color: "var(--status-good)", fontWeight: 700, fontSize: 13 }}>
            <CheckCircle2 size={16} />
            {t("methods.advantages")}
          </div>
          <ul className="mt-8" style={{ margin: 0, paddingInlineStart: 18, fontSize: 13, lineHeight: 1.7 }}>
            {method.advantages.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="flex items-center gap-8" style={{ color: "var(--status-critical)", fontWeight: 700, fontSize: 13 }}>
            <XCircle size={16} />
            {t("methods.limitations")}
          </div>
          <ul className="mt-8" style={{ margin: 0, paddingInlineStart: 18, fontSize: 13, lineHeight: 1.7 }}>
            {method.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-title-row">
          <h3>{t("methods.recommendedCrops", { method: method.short_name })}</h3>
        </div>
        {compatibleCrops.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>
            {t("methods.noCrops")}
          </p>
        ) : (
          <div className="grid grid-cols-3">
            {compatibleCrops.map((c) => (
              <Link
                key={c.id}
                to="/crops"
                onClick={() => setSelectedCropId(c.id)}
                className="card selectable"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="flex items-center gap-8">
                  <span style={{ fontSize: 22 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t(`common.cropNames.${c.id}`, c.name)}</div>
                    <div className="text-muted" style={{ fontSize: 11.5 }}>
                      {c.category}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
