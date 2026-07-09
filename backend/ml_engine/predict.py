"""
ML prediction service.

Loads the trained pipelines once (module-level singletons) and exposes:
  - predict_health(features) -> (label, confidence, class_probabilities)
  - predict_risk(features)   -> (risk_score, confidence)
  - build_explanation(...)   -> human-readable rationale
  - recommend(features)      -> full bundle combining ML output with the
    rule-based AI Decision Engine's problem/action text, with the safety
    layer (safety_rules.py) applied last.

PROTOTYPE NOTE: models are trained on synthetic data (see
dataset_generator.py / train.py) and can be retrained on real farm sensor
history later without changing this module. Confidence for the classifier
is predict_proba's max class probability; the regressor has no native
"confidence," so we use agreement across the forest's individual trees as a
proxy — tighter agreement (lower spread) is reported as higher confidence.
"""

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import data_store  # noqa: E402
from app.services import ai_decision_engine  # noqa: E402

from . import safety_rules  # noqa: E402
from .train import FEATURE_COLUMNS  # noqa: E402

ML_DIR = Path(__file__).resolve().parent
MODELS_DIR = ML_DIR / "models"

_health_model = None
_risk_model = None
_metadata = None


class ModelsNotTrainedError(RuntimeError):
    pass


def _load():
    global _health_model, _risk_model, _metadata
    if _health_model is not None:
        return
    health_path = MODELS_DIR / "health_model.pkl"
    risk_path = MODELS_DIR / "risk_model.pkl"
    if not health_path.exists() or not risk_path.exists():
        raise ModelsNotTrainedError(
            "ML models are not trained yet. From the backend/ directory, run: "
            "`python -m ml_engine.dataset_generator` then `python -m ml_engine.train`."
        )
    _health_model = joblib.load(health_path)
    _risk_model = joblib.load(risk_path)
    meta_path = MODELS_DIR / "metadata.json"
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            _metadata = json.load(f)


def get_metadata() -> dict:
    _load()
    return _metadata or {}


def _features_to_frame(features: dict) -> pd.DataFrame:
    row = {col: features.get(col) for col in FEATURE_COLUMNS}
    return pd.DataFrame([row])


def predict_health(features: dict):
    _load()
    frame = _features_to_frame(features)
    proba = _health_model.predict_proba(frame)[0]
    classes = _health_model.classes_
    best_idx = int(np.argmax(proba))
    label = str(classes[best_idx])
    confidence = float(proba[best_idx])
    class_probabilities = {str(cls): round(float(p), 4) for cls, p in zip(classes, proba)}
    return label, confidence, class_probabilities


def predict_risk(features: dict):
    _load()
    frame = _features_to_frame(features)
    risk_score = float(_risk_model.predict(frame)[0])
    risk_score = max(0.0, min(100.0, risk_score))

    preprocessor = _risk_model.named_steps["preprocess"]
    forest = _risk_model.named_steps["model"]
    transformed = preprocessor.transform(frame)
    tree_predictions = np.array([tree.predict(transformed)[0] for tree in forest.estimators_])
    spread = float(tree_predictions.std())
    confidence = max(0.4, min(0.98, 1 - (spread / 25)))
    return round(risk_score, 1), round(confidence, 2)


def _crop_and_stage(features: dict):
    crop = data_store.get_crop_by_id(features.get("crop_type"))
    stage = features.get("growth_stage")
    if not crop or stage not in crop.get("stages", {}):
        return None, None
    return crop, stage


def _rule_engine_issues(features: dict, crop: dict, stage: str) -> list:
    reading = {
        "ph": features.get("ph"),
        "ec": features.get("ec"),
        "water_temp": features.get("water_temperature"),
        "air_temp": features.get("air_temperature"),
        "humidity": features.get("humidity"),
        "light_intensity": features.get("light_intensity"),
    }
    return ai_decision_engine.analyze_reading(crop, stage, reading)


def build_explanation(features: dict, health_status: str, risk_score: float) -> str:
    crop, stage = _crop_and_stage(features)
    if not crop:
        return (
            f"The model predicted '{health_status}' with a risk score of {risk_score}/100 "
            f"based on the submitted sensor readings."
        )

    issues = _rule_engine_issues(features, crop, stage)
    stage_label = stage.replace("_", " ")

    if not issues:
        return (
            f"The model predicted '{health_status}' (risk score {risk_score}/100) for "
            f"{crop['name']} in the {stage_label} stage — all submitted readings fall within "
            f"the crop's ideal range for this stage."
        )

    top = issues[0]
    return (
        f"The model predicted '{health_status}' (risk score {risk_score}/100) for {crop['name']} "
        f"in the {stage_label} stage, most influenced by: {top['problem_detected']}"
    )


def explain_risk_only(features: dict, risk_score: float) -> str:
    """Same rationale as build_explanation but without needing a health-status label."""
    crop, stage = _crop_and_stage(features)
    if not crop:
        return f"The model predicted a risk score of {risk_score}/100 based on the submitted sensor readings."

    issues = _rule_engine_issues(features, crop, stage)
    stage_label = stage.replace("_", " ")

    if not issues:
        return (
            f"Risk score {risk_score}/100 for {crop['name']} in the {stage_label} stage — all "
            f"submitted readings fall within the crop's ideal range for this stage."
        )

    top = issues[0]
    return (
        f"Risk score {risk_score}/100 for {crop['name']} in the {stage_label} stage, most "
        f"influenced by: {top['problem_detected']}"
    )


def recommend(features: dict) -> dict:
    """Combined bundle: ML predictions + rule-engine problem/action text + safety override."""
    health_status, health_confidence, class_probabilities = predict_health(features)
    risk_score, risk_confidence = predict_risk(features)

    crop, stage = _crop_and_stage(features)
    detected_problem = None
    recommended_action = "No action needed — maintain current settings."
    if crop:
        issues = _rule_engine_issues(features, crop, stage)
        if issues:
            detected_problem = issues[0]["problem_detected"]
            recommended_action = issues[0]["recommended_action"]

    health_status, risk_score, is_override, violations = safety_rules.apply_safety_override(
        features, health_status, risk_score
    )

    if is_override:
        detected_problem = "Safety limit exceeded: " + "; ".join(violations)
        recommended_action = (
            "Immediately inspect and correct the flagged parameter(s) — pause automated "
            "dosing/control until readings return within safe limits."
        )
        confidence = 0.99
        explanation = (
            f"Safety override engaged — {'; '.join(violations)}. The ML prediction was bypassed "
            f"because these values are outside physiologically safe limits, regardless of what "
            f"the model predicted."
        )
    else:
        confidence = round((health_confidence + risk_confidence) / 2, 2)
        explanation = build_explanation(features, health_status, risk_score)

    return {
        "predicted_health_status": health_status,
        "risk_score": risk_score,
        "detected_problem": detected_problem,
        "recommended_action": recommended_action,
        "confidence_score": confidence,
        "explanation": explanation,
        "is_safety_override": is_override,
        "class_probabilities": class_probabilities,
    }
