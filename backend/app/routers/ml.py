from fastapi import APIRouter, HTTPException

from ..models import ActionRecommendation, HealthPrediction, MLFeatures, RiskPrediction
from ml_engine import predict as ml_predict
from ml_engine import safety_rules

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


def _not_trained_error(exc: Exception):
    raise HTTPException(status_code=503, detail=str(exc))


@router.get("/model-info")
def model_info():
    """Metadata for the AI Model Lab page: dataset size, features, accuracy, training date."""
    try:
        return ml_predict.get_metadata()
    except ml_predict.ModelsNotTrainedError as exc:
        _not_trained_error(exc)


@router.post("/predict-health", response_model=HealthPrediction)
def predict_health(features: MLFeatures):
    """Predicts Ideal / Warning / Critical from a raw sensor reading using the trained RandomForestClassifier."""
    payload = features.model_dump()
    try:
        label, confidence, class_probabilities = ml_predict.predict_health(payload)
    except ml_predict.ModelsNotTrainedError as exc:
        _not_trained_error(exc)

    risk_score, _ = ml_predict.predict_risk(payload)
    label, _, is_override, violations = safety_rules.apply_safety_override(payload, label, risk_score)
    if is_override:
        confidence = 0.99
        explanation = (
            f"Safety override engaged — {'; '.join(violations)}. The ML prediction was bypassed "
            f"because these values are outside physiologically safe limits."
        )
    else:
        explanation = ml_predict.build_explanation(payload, label, risk_score)

    return HealthPrediction(
        predicted_health_status=label,
        confidence_score=round(confidence, 4),
        class_probabilities=class_probabilities,
        is_safety_override=is_override,
        explanation=explanation,
    )


@router.post("/predict-risk", response_model=RiskPrediction)
def predict_risk(features: MLFeatures):
    """Predicts a 0-100 risk score from a raw sensor reading using the trained RandomForestRegressor."""
    payload = features.model_dump()
    try:
        risk_score, confidence = ml_predict.predict_risk(payload)
    except ml_predict.ModelsNotTrainedError as exc:
        _not_trained_error(exc)

    violations = safety_rules.check_safety_violations(payload)
    is_override = bool(violations)
    if is_override:
        risk_score = max(risk_score, 90.0)
        confidence = 0.99
        explanation = (
            f"Safety override engaged — {'; '.join(violations)}. Risk score forced to at least "
            f"90 regardless of the model's prediction."
        )
    else:
        explanation = ml_predict.explain_risk_only(payload, risk_score)

    return RiskPrediction(
        risk_score=round(risk_score, 1),
        confidence_score=confidence,
        is_safety_override=is_override,
        explanation=explanation,
    )


@router.post("/recommend-action", response_model=ActionRecommendation)
def recommend_action(features: MLFeatures):
    """
    Full ML bundle: predicted health status, risk score, detected problem,
    recommended action, confidence score, and explanation — combining the
    trained models with the rule-based AI Decision Engine and the safety
    override layer. This is the endpoint the frontend uses for the live
    Monitoring dashboard and the AI Model Lab's try-it panel.
    """
    payload = features.model_dump()
    try:
        result = ml_predict.recommend(payload)
    except ml_predict.ModelsNotTrainedError as exc:
        _not_trained_error(exc)
    return ActionRecommendation(**result)
