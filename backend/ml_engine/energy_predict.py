"""
Energy forecast prediction service.

Loads the trained energy_model.pkl (see energy_train.py) and exposes:
  - predict_next_day(features)  -> {predicted_kwh, confidence_score}
  - predict_next_week(features) -> 7-day forecast + total

Confidence is derived from agreement across the forest's individual trees
(tighter agreement = higher confidence), the same approach used in
ml_engine/predict.py for the crop risk-score regressor.

PROTOTYPE NOTE: "detect abnormal consumption" and "equipment failure risk"
are intentionally NOT part of this trained model — see
app.services.energy_anomaly for those (rule-based heuristics), which keeps
this module focused purely on the one thing it's trained for: forecasting.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from .energy_train import FEATURE_COLUMNS

ML_DIR = Path(__file__).resolve().parent
MODELS_DIR = ML_DIR / "models"

_model = None
_metadata = None


class EnergyModelNotTrainedError(RuntimeError):
    pass


def _load():
    global _model, _metadata
    if _model is not None:
        return
    model_path = MODELS_DIR / "energy_model.pkl"
    if not model_path.exists():
        raise EnergyModelNotTrainedError(
            "Energy forecast model is not trained yet. From the backend/ directory, run: "
            "`python -m ml_engine.energy_dataset_generator` then `python -m ml_engine.energy_train`."
        )
    _model = joblib.load(model_path)
    meta_path = MODELS_DIR / "energy_metadata.json"
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            _metadata = json.load(f)


def get_metadata() -> dict:
    _load()
    return _metadata or {}


def _frame(features: dict) -> pd.DataFrame:
    return pd.DataFrame([{col: features.get(col) for col in FEATURE_COLUMNS}])


def _predict_day(features: dict) -> float:
    _load()
    return float(_model.predict(_frame(features))[0])


def _confidence_for(features: dict) -> float:
    _load()
    forest = _model.named_steps["model"]
    preprocessor = _model.named_steps["preprocess"]
    transformed = preprocessor.transform(_frame(features))
    tree_preds = np.array([tree.predict(transformed)[0] for tree in forest.estimators_])
    spread_ratio = tree_preds.std() / max(tree_preds.mean(), 1.0)
    return round(max(0.5, min(0.97, 1 - spread_ratio)), 2)


def predict_next_day(features: dict) -> dict:
    kwh = round(_predict_day(features), 2)
    return {"predicted_kwh": kwh, "confidence_score": _confidence_for(features)}


def predict_next_week(features: dict) -> dict:
    _load()
    base_dow = features.get("day_of_week", 0)
    days = []
    for offset in range(7):
        day_features = dict(features)
        day_features["day_of_week"] = (base_dow + offset) % 7
        days.append({"day_offset": offset, "predicted_kwh": round(_predict_day(day_features), 2)})
    return {
        "days": days,
        "total_kwh": round(sum(d["predicted_kwh"] for d in days), 2),
        "confidence_score": _confidence_for(features),
    }
