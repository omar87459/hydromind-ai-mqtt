import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Droplets, FlaskConical } from "lucide-react";

const PUMPS = [
  { key: "mainPump", icon: Droplets },
  { key: "phPump", icon: FlaskConical },
];

export default function PumpControlPanel({ pumps, pending, onToggle }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");

  const handleToggle = (key, state) => {
    if (!password) {
      alert("Enter pump password");
      return;
    }

    onToggle(key, state, password);
  };

  const [password, setPassword] = useState("");

  const handleToggle = (key, state) => {
    if (!password) {
      alert("Enter pump password");
      return;
    }

    onToggle(key, state, password);
  };

  return (
    <div className="card">
      <div className="card-title-row">
        <h3>{t("pumpControl.title")}</h3>
      </div>


      <div className="mt-8">
        <input
          type="password"
          className="input"
          placeholder="Pump password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-12 mt-12">

<div className="mt-8">
  <input
    type="password"
    placeholder="Pump password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="input"
  />
</div>
      <div className="grid grid-cols-2 gap-12">

        {PUMPS.map(({ key, icon: Icon }) => {
          const pump = pumps[key];
          const isOn = !!pump?.state;
          const isPending = !!pending[key];

          return (
            <div
              key={key}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <Icon size={16} color="var(--brand-blue)" />

                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 13.5
                    }}
                  >
                    {t(`pumpControl.${key}`)}
                  </span>
                </div>

                <span
                  className={`badge ${
                    isOn ? "badge-good" : "badge-neutral"
                  }`}
                >
                  {isOn
                    ? t("common.on")
                    : t("common.off")}
                </span>
              </div>


              <button
                className={`btn btn-sm btn-block mt-8 ${
                  isOn ? "" : "btn-primary"
                }`}
                disabled={isPending}

                onClick={() =>
                  handleToggle(
                    key,
                    !isOn
                  )
                }

                onClick={() => handleToggle(key, !isOn)}

              >
                {isPending
                  ? t("pumpControl.updating")
                  : isOn
                  ? t("pumpControl.turnOff")
                  : t("pumpControl.turnOn")}
              </button>


              {pump?.source &&
                pump.source !== "default" && (
                  <div
                    className="text-muted mt-8"
                    style={{ fontSize: 11 }}
                  >
                    {pump.source === "esp32"
                      ? t("pumpControl.confirmed")
                      : t("pumpControl.pendingConfirmation")}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
