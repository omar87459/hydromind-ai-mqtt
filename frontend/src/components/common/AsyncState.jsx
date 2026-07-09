export function LoadingBlock({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-8 text-muted" style={{ padding: "24px 0" }}>
      <span className="spinner" />
      {label}
    </div>
  );
}

export function ErrorBlock({ message }) {
  return (
    <div className="card" style={{ borderColor: "var(--status-critical)" }}>
      <div className="flex items-center gap-8">
        <span className="badge badge-critical">Error</span>
        <span>{message || "Something went wrong talking to the HydroMind AI backend."}</span>
      </div>
      <p className="text-muted mt-8" style={{ fontSize: 12.5 }}>
        Make sure the FastAPI backend is running at the configured VITE_API_URL (defaults to
        http://localhost:8000).
      </p>
    </div>
  );
}
