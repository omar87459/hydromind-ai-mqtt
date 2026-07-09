import { Info } from "lucide-react";
import ArchitectureDiagram from "../components/architecture/ArchitectureDiagram";

export default function ArchitecturePage() {
  return (
    <div>
      <p className="section-sub">
        A conceptual view of how HydroMind AI would connect a farm's sensors to the cloud and,
        where needed, satellite connectivity.
      </p>

      <ArchitectureDiagram />

      <div className="card mt-16" style={{ borderColor: "var(--brand-blue)" }}>
        <div className="flex items-center gap-8" style={{ color: "var(--brand-blue)", fontWeight: 700, fontSize: 13.5 }}>
          <Info size={16} />
          Concept / Prototype Notice
        </div>
        <p className="text-secondary mt-8" style={{ fontSize: 13, lineHeight: 1.6 }}>
          This diagram illustrates the intended production architecture. In this hackathon
          prototype, sensor data is simulated locally and the "cloud" and "satellite" layers are{" "}
          <strong>not actually implemented</strong> — there is no real satellite hardware or
          communication link. The idea is to show how HydroMind AI would scale to real farms,
          including remote locations with unreliable internet, where a local farm server keeps
          monitoring and automation running independently and relays only critical alerts over a
          low-bandwidth satellite channel when needed.
        </p>
      </div>

      <div className="grid grid-cols-3 mt-16">
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Why local-first?</h3>
          <p className="text-secondary" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            The local farm server can run the AI Decision Engine and automation loop even if the
            internet connection is completely down, so crops are never left unmonitored.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Why the cloud layer?</h3>
          <p className="text-secondary" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            Centralizing data across many farms enables cross-farm analytics, model improvement,
            and a unified dashboard experience for farmers managing multiple sites.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Why satellite backup?</h3>
          <p className="text-secondary" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            Many hydroponic farms are in rural or off-grid areas. A satellite fallback ensures
            critical alerts (e.g. a failed pump) still reach the farmer even without terrestrial
            internet.
          </p>
        </div>
      </div>
    </div>
  );
}
