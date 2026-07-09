import { Sparkles, FlaskConical, Zap, Sun, Thermometer, Droplet } from "lucide-react";
import { useApp, STAGE_LABELS } from "../context/AppContext";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import StageTimeline from "../components/growth/StageTimeline";

function TargetTile({ icon: Icon, label, value }) {
  return (
    <div className="card">
      <div className="flex items-center gap-8 text-muted" style={{ fontSize: 12 }}>
        <Icon size={15} />
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default function GrowthStagesPage() {
  const {
    crops,
    loading,
    loadError,
    stages,
    selectedCropId,
    setSelectedCropId,
    selectedCrop,
    selectedStage,
    setSelectedStage,
  } = useApp();

  if (loading) return <LoadingBlock label="Loading growth stage data..." />;
  if (loadError) return <ErrorBlock message={loadError} />;
  if (!selectedCrop) return null;

  const stageData = selectedCrop.stages[selectedStage];

  return (
    <div>
      <p className="section-sub">
        Pick a crop and move through its lifecycle — targets and AI guidance update
        automatically for each stage.
      </p>

      <div className="flex items-center gap-8 wrap mt-8" style={{ marginBottom: 20 }}>
        {crops.map((c) => (
          <button
            key={c.id}
            className="btn btn-sm"
            style={
              c.id === selectedCropId
                ? { background: "var(--brand-blue)", color: "#fff", borderColor: "var(--brand-blue)" }
                : {}
            }
            onClick={() => setSelectedCropId(c.id)}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div className="card">
        <StageTimeline stages={stages} activeStage={selectedStage} onSelect={setSelectedStage} />
      </div>

      <div className="mt-24">
        <div className="card-title-row">
          <h3>
            {selectedCrop.icon} {selectedCrop.name} — {STAGE_LABELS[selectedStage]} Targets
          </h3>
        </div>
        <div className="grid grid-cols-4">
          <TargetTile
            icon={FlaskConical}
            label="pH Target"
            value={`${stageData.ph.min}–${stageData.ph.max}`}
          />
          <TargetTile
            icon={Zap}
            label="EC Target"
            value={`${stageData.ec.min}–${stageData.ec.max} mS/cm`}
          />
          <TargetTile
            icon={Sun}
            label="Lighting"
            value={`${stageData.light_hours}h · ${stageData.light_intensity.min}-${stageData.light_intensity.max}`}
          />
          <TargetTile
            icon={Thermometer}
            label="Air / Water Temp"
            value={`${stageData.air_temp.min}-${stageData.air_temp.max}°C / ${stageData.water_temp.min}-${stageData.water_temp.max}°C`}
          />
        </div>
      </div>

      <div className="card mt-16" style={{ borderColor: "var(--brand-blue)" }}>
        <div className="flex items-center gap-8" style={{ color: "var(--brand-blue)", fontWeight: 700, fontSize: 13.5 }}>
          <Sparkles size={16} />
          AI Notes for this stage
        </div>
        <p className="mt-8" style={{ fontSize: 13.5, lineHeight: 1.6, margin: "8px 0 0" }}>
          {stageData.ai_notes}
        </p>
      </div>
    </div>
  );
}
