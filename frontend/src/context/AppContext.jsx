import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCrops, fetchMethods } from "../api";

const AppContext = createContext(null);

const STAGES = ["seedling", "vegetative", "flowering_fruiting", "harvest"];

export function AppProvider({ children }) {
  const [crops, setCrops] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [selectedCropId, setSelectedCropId] = useState("lettuce");
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [selectedStage, setSelectedStage] = useState("vegetative");

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCrops(), fetchMethods()])
      .then(([cropsData, methodsData]) => {
        if (cancelled) return;
        setCrops(cropsData);
        setMethods(methodsData);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message || "Failed to reach the HydroMind AI backend.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
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
    loading,
    loadError,
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
