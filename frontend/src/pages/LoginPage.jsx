import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sprout, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginError, loggingIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) navigate("/", { replace: true });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "var(--page-plane)",
      }}
    >
      <form onSubmit={handleSubmit} className="card" style={{ width: "100%", maxWidth: 380 }}>
        <div className="flex items-center gap-10" style={{ marginBottom: 4 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-sm)",
              background: "linear-gradient(135deg, var(--brand-blue), var(--brand-aqua))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🌱
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t("nav.brandName")}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>
              {t("nav.brandTag")}
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, margin: "18px 0 4px" }}>{t("auth.loginTitle")}</h2>
        <p className="text-secondary" style={{ fontSize: 12.5, margin: "0 0 18px" }}>
          {t("auth.loginSubtitle")}
        </p>

        <label className="text-muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          {t("auth.username")}
        </label>
        <input
          type="text"
          className="input"
          style={{ width: "100%", marginBottom: 12 }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="text-muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          {t("auth.password")}
        </label>
        <input
          type="password"
          className="input"
          style={{ width: "100%", marginBottom: 16 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {loginError && (
          <div
            className="text-secondary"
            style={{
              fontSize: 12.5,
              marginBottom: 12,
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--status-critical-bg)",
              color: "var(--status-critical)",
            }}
          >
            {loginError}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loggingIn}>
          {loggingIn ? <span className="spinner" /> : <LogIn size={15} />}
          {t("auth.loginButton")}
        </button>

        <div className="flex items-center gap-6 text-muted mt-16" style={{ fontSize: 11 }}>
          <Sprout size={12} />
          {t("auth.roleHint")}
        </div>
      </form>
    </div>
  );
}
