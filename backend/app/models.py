from typing import List, Optional

from pydantic import BaseModel


class SensorReading(BaseModel):
    ph: float
    ec: float
    water_temp: float
    air_temp: float
    humidity: float
    water_level: float
    light_intensity: float


class ParameterStatus(BaseModel):
    parameter: str
    label: str
    value: float
    unit: str
    ideal_min: float
    ideal_max: float
    status: str  # ideal | warning | critical


class SensorSnapshot(BaseModel):
    timestamp: str
    crop_id: Optional[str] = None
    stage: Optional[str] = None
    reading: SensorReading
    statuses: List[ParameterStatus]
    overall_status: str


class AnalyzeRequest(BaseModel):
    crop_id: str
    stage: str = "vegetative"
    reading: Optional[SensorReading] = None


class Issue(BaseModel):
    parameter: str
    problem_detected: str
    severity: str  # warning | critical
    recommended_action: str
    automatic_action_suggestion: str
    confidence_score: float


class AnalyzeResponse(BaseModel):
    crop_id: str
    crop_name: str
    stage: str
    timestamp: str
    reading: SensorReading
    issues: List[Issue]
    overall_status: str


class AssistantRequest(BaseModel):
    question: str


class AssistantResponse(BaseModel):
    answer: str
    matched_topic: Optional[str] = None
    confidence: float
    source_ids: List[str] = []


class MLFeatures(BaseModel):
    crop_type: str
    hydroponic_method: str
    growth_stage: str
    ph: float
    ec: float
    water_temperature: float
    air_temperature: float
    humidity: float
    water_level: float
    light_intensity: float
    light_hours: float
    days_after_planting: int


class HealthPrediction(BaseModel):
    predicted_health_status: str
    confidence_score: float
    class_probabilities: dict
    is_safety_override: bool
    explanation: str


class RiskPrediction(BaseModel):
    risk_score: float
    confidence_score: float
    is_safety_override: bool
    explanation: str


class ActionRecommendation(BaseModel):
    predicted_health_status: str
    risk_score: float
    detected_problem: Optional[str] = None
    recommended_action: str
    confidence_score: float
    explanation: str
    is_safety_override: bool
    class_probabilities: dict


class RagSource(BaseModel):
    source: str
    heading: Optional[str] = None
    snippet: str
    score: float


class RagAskRequest(BaseModel):
    question: str


class RagAskResponse(BaseModel):
    answer: str
    sources: List[RagSource]
    confidence: float


class IoTReadingRequest(BaseModel):
    """Body a real ESP32 (or the demo POST) sends to report one sensor reading."""

    value: float
    unit: Optional[str] = None
    battery_level: Optional[float] = None
    signal_strength: Optional[float] = None


class IoTModeRequest(BaseModel):
    mode: str  # "simulation" | "live"
