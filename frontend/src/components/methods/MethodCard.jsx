const COMPLEXITY_BADGE = {
  Beginner: "badge-good",
  Intermediate: "badge-warning",
  Advanced: "badge-critical",
};

export default function MethodCard({ method, active, onClick }) {
  return (
    <div className={`card selectable ${active ? "active" : ""}`} onClick={onClick}>
      <div className="flex items-center gap-12">
        <div style={{ fontSize: 28 }}>{method.icon}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{method.name}</div>
        </div>
      </div>
      <div className="text-secondary mt-8" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
        {method.description}
      </div>
      <div className="flex gap-6 wrap mt-16">
        <span className={`badge ${COMPLEXITY_BADGE[method.complexity] || "badge-neutral"}`}>
          {method.complexity}
        </span>
        <span className="badge badge-blue">💧 {method.water_efficiency} efficiency</span>
      </div>
    </div>
  );
}
