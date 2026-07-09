import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function MethodDetail({ method }) {
  const { crops, setSelectedCropId } = useApp();
  const compatibleCrops = crops.filter((c) => c.suitable_methods.includes(method.id));

  return (
    <div>
      <div className="card-title-row">
        <h3>
          {method.icon} {method.name}
        </h3>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-8" style={{ color: "var(--status-good)", fontWeight: 700, fontSize: 13 }}>
            <CheckCircle2 size={16} />
            Advantages
          </div>
          <ul className="mt-8" style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
            {method.advantages.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="flex items-center gap-8" style={{ color: "var(--status-critical)", fontWeight: 700, fontSize: 13 }}>
            <XCircle size={16} />
            Limitations
          </div>
          <ul className="mt-8" style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
            {method.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-title-row">
          <h3>Recommended Crops for {method.short_name}</h3>
        </div>
        {compatibleCrops.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>
            No crops in the current database are matched to this method.
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
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</div>
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
