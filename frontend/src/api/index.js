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
