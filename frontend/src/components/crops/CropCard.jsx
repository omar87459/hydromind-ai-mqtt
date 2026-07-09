export default function CropCard({ crop, active, onClick }) {
  return (
    <div className={`card selectable ${active ? "active" : ""}`} onClick={onClick}>
      <div className="flex items-center gap-12">
        <div style={{ fontSize: 30 }}>{crop.icon}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{crop.name}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            {crop.category}
          </div>
        </div>
      </div>
      <div className="text-secondary mt-8" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
        {crop.description}
      </div>
      <div className="flex gap-6 wrap mt-16">
        <span className="badge badge-blue">
          {crop.growth_cycle_days.min}-{crop.growth_cycle_days.max}d cycle
        </span>
        <span className="badge badge-aqua">
          {crop.suitable_methods.length} compatible methods
        </span>
      </div>
    </div>
  );
}
