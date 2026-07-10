import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical, Database, Cpu, CalendarClock, Target, Sparkles, Play } from "lucide-react";
import { useApp } from "../context/AppContext";
import { fetchModelInfo, postRecommendAction } from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import StatusBadge from "../components/common/StatusBadge";

function mid(range) {
  return Math.round(((range.min + range.max) / 2) * 100) / 100;
}

function InfoTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="card">
      <div className="flex items-center gap-8 text-muted" style={{ fontSize: 12 }}>
        <Icon size={15} />
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {sub && (
        <div className="text-muted mt-8" style={{ fontSize: 11.5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, step = 0.1 }) {
  return (
    <label className="flex flex-col gap-6" style={{ fontSize: 12 }}>
      <span className="text-muted">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          padding: "8px 10px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          background: "var(--surface-2)",
          color: "var(--text-primary)",
          fontSize: 13,
        }}
      />
    </label>
  );
}

export default function ModelLabPage() {
  const { t } = useTranslation();
  const { crops, stages, loading, loadError, selectedCropId, selectedStage } = useApp();

  const [modelInfo, setModelInfo] = useState(null);
  const [infoError, setInfoError] = useState(null);

  const [cropType, setCropType] = useState(selectedCropId);
  const [method, setMethod] = useState("");
  const [stage, setStage] = useState(selectedStage);
  const [form, setForm] = useState(null);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  useEffect(() => {
    fetchModelInfo()
      .then(setModelInfo)
      .catch((err) => setInfoError(err.message || t("modelLab.loadModelError")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crop = useMemo(() => crops.find((c) => c.id === cropType), [crops, cropType]);

  useEffect(() => {
    if (!crop) return;
    if (!crop.suitable_methods.includes(method)) {
      setMethod(crop.suitable_methods[0]);
    }
    const stageData = crop.stages[stage] || crop.stages[Object.keys(crop.stages)[0]];
    setForm({
      ph: mid(stageData.ph),
      ec: mid(stageData.ec),
      water_temperature: mid(stageData.water_temp),
      air_temperature: mid(stageData.air_temp),
      humidity: mid(crop.humidity_range),
      water_level: 80,
      light_intensity: mid(stageData.light_intensity),
      light_hours: stageData.light_hours,
      days_after_planting: 10,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop, stage]);

  async function runPrediction() {
    if (!form || !crop) return;
    setRunning(true);
    setRunError(null);
    try {
      const payload = {
        crop_type: cropType,
        hydroponic_method: method,
        growth_stage: stage,
        ...form,
      };
      const prediction = await postRecommendAction(payload);
      setResult(prediction);
    } catch (err) {
      setRunError(err.message || t("modelLab.predictionError"));
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingBlock label={t("common.loading")} />;
  if (loadError) return <ErrorBlock message={loadError} />;

  return (
    <div>
      <p className="section-sub">{t("modelLab.intro")}</p>

      {infoError && <ErrorBlock message={infoError} />}

      {modelInfo && (
        <>
          <div className="grid grid-cols-4">
            <InfoTile
              icon={Database}
              label={t("modelLab.datasetSize")}
              value={modelInfo.dataset_size}
              sub={t("modelLab.trainTestSplit", { train: modelInfo.train_size, test: modelInfo.test_size })}
            />
            <InfoTile
              icon={Cpu}
              label={t("modelLab.modelType")}
              value={t("modelLab.randomForest")}
              sub={t("modelLab.treesPerModel", { count: modelInfo.health_model.n_estimators })}
            />
            <InfoTile
              icon={Target}
              label={t("modelLab.healthAccuracy")}
              value={`${Math.round(modelInfo.health_model.accuracy * 100)}%`}
              sub={t("modelLab.onTestSet")}
            />
            <InfoTile
              icon={CalendarClock}
              label={t("modelLab.lastTrained")}
              value={new Date(modelInfo.trained_at).toLocaleDateString("en-US")}
              sub={new Date(modelInfo.trained_at).toLocaleTimeString("en-US")}
            />
          </div>

          <div className="grid grid-cols-2 mt-16">
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: 14 }}>{t("modelLab.healthClassifierTitle")}</h3>
              <div className="kv-row">
                <span className="kv-label">{t("modelLab.type")}</span>
                <span className="kv-value">{modelInfo.health_model.type}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t("modelLab.classes")}</span>
                <span className="kv-value">{modelInfo.health_classes.join(", ")}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t("modelLab.accuracyTestSet")}</span>
                <span className="kv-value">{(modelInfo.health_model.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t("modelLab.trainingStatus")}</span>
                <span className="badge badge-good">{t("modelLab.trained")}</span>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: 14 }}>{t("modelLab.riskRegressorTitle")}</h3>
              <div className="kv-row">
                <span className="kv-label">{t("modelLab.type")}</span>
                <span className="kv-value">{modelInfo.risk_model.type}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t("modelLab.r2TestSet")}</span>
                <span className="kv-value">{modelInfo.risk_model.r2_score}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t("modelLab.meanAbsoluteError")}</span>
                <span className="kv-value">
                  {modelInfo.risk_model.mean_absolute_error} {t("modelLab.points")}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">{t("modelLab.trainingStatus")}</span>
                <span className="badge badge-good">{t("modelLab.trained")}</span>
              </div>
            </div>
          </div>

          <div className="card mt-16">
            <h3 style={{ marginTop: 0, fontSize: 14 }}>{t("modelLab.featuresUsedTitle")}</h3>
            <div className="flex gap-6 wrap">
              {modelInfo.feature_columns.map((f) => (
                <span key={f} className="badge badge-blue">
                  {f}
                </span>
              ))}
            </div>
            <p className="text-secondary mt-16" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              {modelInfo.note}
            </p>
          </div>
        </>
      )}

      <div className="card mt-24" style={{ borderColor: "var(--brand-blue)" }}>
        <div className="card-title-row">
          <h3 className="flex items-center gap-8">
            <FlaskConical size={16} />
            {t("modelLab.tryItTitle")}
          </h3>
        </div>
        <p className="text-secondary" style={{ fontSize: 12.5, marginTop: 0 }}>
          {t("modelLab.tryItIntro")}
        </p>

        <div className="grid grid-cols-3 mt-16">
          <label className="flex flex-col gap-6" style={{ fontSize: 12 }}>
            <span className="text-muted">{t("modelLab.crop")}</span>
            <select value={cropType} onChange={(e) => setCropType(e.target.value)} className="btn btn-sm">
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {t(`common.cropNames.${c.id}`, c.name)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-6" style={{ fontSize: 12 }}>
            <span className="text-muted">{t("modelLab.hydroponicMethod")}</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="btn btn-sm">
              {crop?.suitable_methods.map((m) => (
                <option key={m} value={m}>
                  {t(`common.methodNames.${m}`, m)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-6" style={{ fontSize: 12 }}>
            <span className="text-muted">{t("modelLab.growthStage")}</span>
            <select value={stage} onChange={(e) => setStage(e.target.value)} className="btn btn-sm">
              {stages.map((s) => (
                <option key={s} value={s}>
                  {t(`common.stages.${s}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {form && (
          <div className="grid grid-cols-4 mt-16">
            <NumberField label={t("modelLab.ph")} value={form.ph} onChange={(v) => setForm({ ...form, ph: v })} />
            <NumberField label={t("modelLab.ecUnit")} value={form.ec} onChange={(v) => setForm({ ...form, ec: v })} />
            <NumberField
              label={t("modelLab.waterTempUnit")}
              value={form.water_temperature}
              onChange={(v) => setForm({ ...form, water_temperature: v })}
            />
            <NumberField
              label={t("modelLab.airTempUnit")}
              value={form.air_temperature}
              onChange={(v) => setForm({ ...form, air_temperature: v })}
            />
            <NumberField
              label={t("modelLab.humidityUnit")}
              value={form.humidity}
              onChange={(v) => setForm({ ...form, humidity: v })}
            />
            <NumberField
              label={t("modelLab.waterLevelUnit")}
              value={form.water_level}
              onChange={(v) => setForm({ ...form, water_level: v })}
            />
            <NumberField
              label={t("modelLab.lightIntensityLabel")}
              value={form.light_intensity}
              onChange={(v) => setForm({ ...form, light_intensity: v })}
              step={1}
            />
            <NumberField
              label={t("modelLab.daysAfterPlanting")}
              value={form.days_after_planting}
              onChange={(v) => setForm({ ...form, days_after_planting: v })}
              step={1}
            />
          </div>
        )}

        <button className="btn btn-primary mt-16" onClick={runPrediction} disabled={running || !form}>
          {running ? <span className="spinner" /> : <Play size={14} />}
          {t("modelLab.runPrediction")}
        </button>

        {runError && <ErrorBlock message={runError} />}

        {result && (
          <div className="grid grid-cols-2 mt-16" style={{ alignItems: "start" }}>
            <div
              className="card"
              style={{
                borderColor:
                  result.predicted_health_status === "Critical"
                    ? "var(--status-critical)"
                    : result.predicted_health_status === "Warning"
                    ? "var(--status-warning)"
                    : "var(--status-good)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {t("modelLab.aiHealthPrediction")}
                </span>
                <StatusBadge status={result.predicted_health_status.toLowerCase()} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 10 }}>
                {t("modelLab.riskScoreOutOf", { score: result.risk_score })}
              </div>
              <div className="meter-track mt-8">
                <div
                  className="meter-fill"
                  style={{
                    width: `${result.risk_score}%`,
                    background:
                      result.risk_score >= 70
                        ? "var(--status-critical)"
                        : result.risk_score >= 35
                        ? "var(--status-warning)"
                        : "var(--status-good)",
                  }}
                />
              </div>
              <div className="flex items-center gap-8 mt-16" style={{ fontSize: 12.5 }}>
                <Sparkles size={13} color="var(--brand-blue)" />
                {t("modelLab.confidencePct", { pct: Math.round(result.confidence_score * 100) })}
                {result.is_safety_override && <span className="badge badge-critical">{t("monitoring.safetyOverride")}</span>}
              </div>
            </div>
            <div className="card">
              <div className="text-muted" style={{ fontSize: 12 }}>
                {t("modelLab.detectedProblem")}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "6px 0 12px" }}>
                {result.detected_problem || t("modelLab.noProblemDetected")}
              </p>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {t("modelLab.recommendedAction")}
              </div>
              <p style={{ fontSize: 13, margin: "6px 0 12px" }}>{result.recommended_action}</p>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {t("modelLab.explanation")}
              </div>
              <p className="text-secondary" style={{ fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.5 }}>
                {result.explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
