import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchIotNetworkStatus } from "../api";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import LiveArchitectureDiagram from "../components/architecture/LiveArchitectureDiagram";

const POLL_INTERVAL_MS = 2500;

export default function FarmConnectivityPage() {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState(null);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function tick() {
      try {
        const data = await fetchIotNetworkStatus();
        if (cancelledRef.current) return;
        setNodes(data.nodes);
        setError(null);
      } catch (err) {
        if (!cancelledRef.current) setError(err.message || "Could not reach the backend.");
      }
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <p className="section-sub">{t("farmNetwork.intro")}</p>

      {error && <ErrorBlock message={error} />}

      {!nodes ? <LoadingBlock label={t("common.loading")} /> : <LiveArchitectureDiagram nodes={nodes} />}
    </div>
  );
}
