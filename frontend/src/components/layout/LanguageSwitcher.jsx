import { useTranslation } from "react-i18next";
import { setLanguage } from "../../i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <div className="flex items-center" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
      <button
        className="btn btn-sm"
        style={{
          border: "none",
          borderRadius: 0,
          background: current === "en" ? "var(--brand-blue)" : "transparent",
          color: current === "en" ? "#fff" : "var(--text-secondary)",
        }}
        onClick={() => setLanguage("en")}
        aria-pressed={current === "en"}
      >
        EN
      </button>
      <button
        className="btn btn-sm"
        style={{
          border: "none",
          borderRadius: 0,
          background: current === "ar" ? "var(--brand-blue)" : "transparent",
          color: current === "ar" ? "#fff" : "var(--text-secondary)",
        }}
        onClick={() => setLanguage("ar")}
        aria-pressed={current === "ar"}
      >
        عربي
      </button>
    </div>
  );
}
