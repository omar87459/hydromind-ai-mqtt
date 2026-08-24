import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCrops, fetchMethods } from "../api";
import { waitForBackendReady } from "../utils/backendReady";

const AppContext = createContext(null);

const STAGES = ["seedling", "vegetative", "flowering_fruiting", "harvest"];

// How many times to retry the actual data fetch once the backend has
// already confirmed it's awake (via waitForBackendReady) — a failure here
// is more likely a transient blip than a cold start, so this stays short.
const DATA_FETCH_RETRIES = 2;
const DATA_FETCH_RETRY_DELAY_MS = 2000;

async function fetchInitialData(attempt = 1) {
  try {
    return await Promise.all([fetchCrops(), fetchMethods()]);
  } catch (err) {
    if (attempt >= DATA_FETCH_RETRIES) throw err;
    await new Promise((resolve) => setTimeout(resolve, DATA_FETCH_RETRY_DELAY_MS));
    return fetchInitialData(attempt + 1);
  }
}

export function AppProvider({ children }) {
  const [crops, setCrops] = useState([]);
  const [methods, setMethods] = useState([]);

  // connectionPhase drives the one-time startup gate in App.jsx:
  //   "connecting"   -> waiting for the backend to wake up / respond to /health
  //   "loading-data" -> backend is awake, fetching crops + methods
  //   "ready"        -> app is usable
  //   "error"        -> exhausted retries; a real, sustained failure
  const [connectionPhase, setConnectionPhase] = useState("connecting");
  const [loadError, setLoadError] = useState(null);

  const [selectedCropId, setSelectedCropId] = useState("lettuce");
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [selectedStage, setSelectedStage] = useState("vegetative");

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      setConnectionPhase("connecting");
      const backendIsUp = await waitForBackendReady();
      if (cancelled) return;

      if (!backendIsUp) {
        setLoadError("Could not reach the HydroMind AI backend after several attempts.");
        setConnectionPhase("error");
        return;
      }

      setConnectionPhase("loading-data");
      try {
        const [cropsData, methodsData] = await fetchInitialData();
        if (cancelled) return;
        setCrops(cropsData);
        setMethods(methodsData);
        setLoadError(null);
        setConnectionPhase("ready");
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.message || "Failed to reach the HydroMind AI backend.");
        setConnectionPhase("error");
      }
    }

    connect();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCrop = useMemo(
    () => crops.find((c) => c.id === selectedCropId) || null,
    [crops, selectedCropId]
  );

  const selectedMethod = useMemo(
    () => methods.find((m) => m.id === selectedMethodId) || null,
    [methods, selectedMethodId]
  );

  const value = {
    crops,
    methods,
    // Back-compat shape: every existing page checks `loading` then
    // `loadError` in that order, exactly as before — connectionPhase is
    // additive, only consumed by the top-level startup gate in App.jsx.
    loading: connectionPhase !== "ready" && connectionPhase !== "error",
    loadError,
    connectionPhase,
    stages: STAGES,
    selectedCropId,
    setSelectedCropId,
    selectedCrop,
    selectedMethodId,
    setSelectedMethodId,
    selectedMethod,
    selectedStage,
    setSelectedStage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
