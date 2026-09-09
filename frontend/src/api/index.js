import client from "./client";

export async function fetchCrops() {
  const { data } = await client.get("/crops");
  return data;
}

export async function fetchCrop(cropId) {
  const { data } = await client.get(`/crops/${cropId}`);
  return data;
}

export async function fetchMethods() {
  const { data } = await client.get("/methods");
  return data;
}

export async function fetchMethod(methodId) {
  const { data } = await client.get(`/methods/${methodId}`);
  return data;
}

export async function fetchMethodCrops(methodId) {
  const { data } = await client.get(`/methods/${methodId}/crops`);
  return data;
}

export async function fetchSensorData(cropId, stage) {
  const { data } = await client.get("/sensor-data", {
    params: { crop_id: cropId, stage },
  });
  return data;
}

export async function postAnalyze(cropId, stage, reading) {
  const { data } = await client.post("/analyze", {
    crop_id: cropId,
    stage,
    reading,
  });
  return data;
}

export async function postAssistant(question) {
  const { data } = await client.post("/assistant", { question });
  return data;
}

export async function fetchModelInfo() {
  const { data } = await client.get("/ml/model-info");
  return data;
}

export async function postPredictHealth(features) {
  const { data } = await client.post("/ml/predict-health", features);
  return data;
}

export async function postPredictRisk(features) {
  const { data } = await client.post("/ml/predict-risk", features);
  return data;
}

export async function postRecommendAction(features) {
  const { data } = await client.post("/ml/recommend-action", features);
  return data;
}

export async function postRagAsk(question) {
  const { data } = await client.post("/rag/ask", { question });
  return data;
}

export async function fetchIotSensors() {
  const { data } = await client.get("/iot/sensors");
  return data;
}

export async function fetchIotNetworkStatus() {
  const { data } = await client.get("/iot/network-status");
  return data;
}

export async function fetchIotDiagnostics() {
  const { data } = await client.get("/iot/diagnostics");
  return data;
}

export async function postIotMode(mode) {
  const { data } = await client.post("/iot/mode", { mode });
  return data;
}

export async function fetchIotPumps() {
  const { data } = await client.get("/iot/pumps");
  return data;
}

export async function postIotControl(
  pump,
  state,
  password
) {
  const { data } = await client.post(
    "/iot/control",
    {
      pump,
      state,
      password,
    }
  );

  return data;
}

export async function fetchEnergyLive() {
  const { data } = await client.get("/energy/live");
  return data;
}

export async function fetchEnergyDevices() {
  const { data } = await client.get("/energy/devices");
  return data;
}

export async function postEnergyDeviceControl(deviceId, payload) {
  const { data } = await client.post(`/energy/devices/${deviceId}/control`, payload);
  return data;
}

export async function fetchEnergyMode() {
  const { data } = await client.get("/energy/mode");
  return data;
}

export async function postEnergyMode(mode) {
  const { data } = await client.post("/energy/mode", { mode });
  return data;
}

export async function fetchEnergyRecommendations(cropId, stage) {
  const { data } = await client.get("/energy/recommendations", {
    params: { crop_id: cropId, stage },
  });
  return data;
}

export async function fetchEnergySummary() {
  const { data } = await client.get("/energy/summary");
  return data;
}

export async function fetchEnergyHistory(granularity, start, end) {
  const { data } = await client.get("/energy/history", { params: { granularity, start, end } });
  return data;
}

export async function fetchEnergyDeviceComparison(start, end) {
  const { data } = await client.get("/energy/history/devices", { params: { start, end } });
  return data;
}

export async function fetchEnergyPeakHours(date) {
  const { data } = await client.get("/energy/history/peak-hours", { params: { date } });
  return data;
}

export async function fetchEnergyPredictions(growthStage) {
  const { data } = await client.get("/energy/predictions", { params: { growth_stage: growthStage } });
  return data;
}

export async function fetchEnergyModelInfo() {
  const { data } = await client.get("/energy/model-info");
  return data;
}

export async function fetchEnergyAlerts() {
  const { data } = await client.get("/energy/alerts");
  return data;
}

export async function downloadEnergyReport(reportType, format) {
  const response = await client.get(`/energy/reports/${reportType}`, {
    params: { format },
    responseType: "blob",
  });
  const blobUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `hydromind-${reportType}-report.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
