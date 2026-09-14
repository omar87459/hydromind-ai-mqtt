import { useState } from "react";
import { ChevronDown } from "lucide-react";

// A .card whose body can be collapsed. Uncontrolled by default
// (`defaultOpen`); pass `open`/`onToggle` to control it externally.
// `badge` renders in the header even while collapsed, so e.g. a device's
// connection status is visible without expanding the card.
export default function Collapsible({ title, badge, defaultOpen = false, open, onToggle, children }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : internalOpen;

  function toggle() {
    if (onToggle) onToggle(!isOpen);
    else setInternalOpen((prev) => !prev);
  }

  return (
    <div className="card">
      <button
        type="button"
        className="collapsible-header"
        onClick={toggle}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-8" style={{ fontWeight: 700, fontSize: 14 }}>
          {title}
        </span>
        <span className="flex items-center gap-8">
          {badge}
          <ChevronDown size={16} className={`collapsible-chevron ${isOpen ? "open" : ""}`} />
        </span>
      </button>

      {isOpen && <div className="collapsible-body">{children}</div>}
    </div>
  );
}
