import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict, Optional
from app.db.session import get_db
from app.db.models import Model, ModelVersion, Deployment, PredictionLog, User
from app.schemas.schemas import PredictRequest, PredictResponse, GroundTruthLog
from app.api.deps import get_current_user
from model_adapters.factory import get_model_adapter

router = APIRouter(prefix="", tags=["Prediction API"])

@router.post("/models/{model_id}/predict", response_model=PredictResponse)
def predict_model(
    model_id: str,
    payload: PredictRequest,
    version: Optional[str] = None,
    db: Session = Depends(get_db)
):
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    if version:
        ver = db.query(ModelVersion).filter(ModelVersion.model_id == model_id, ModelVersion.version == version).first()
    else:
        # Default to Production version, or latest version if no Production version exists
        ver = db.query(ModelVersion).filter(ModelVersion.model_id == model_id, ModelVersion.stage == "Production").first()
        if not ver:
            ver = db.query(ModelVersion).filter(ModelVersion.model_id == model_id).order_by(ModelVersion.created_at.desc()).first()

    if not ver:
        raise HTTPException(status_code=404, detail="No model version available for inference.")

    # Instantiate model adapter dynamically
    adapter = get_model_adapter(
        framework=model.framework,
        artifact_path=ver.artifact_path,
        input_schema=ver.input_schema,
        output_schema=ver.output_schema
    )

    # Validate input schema
    is_valid, err_msg = adapter.validate_input(payload.input_data)
    if not is_valid:
        raise HTTPException(status_code=422, detail=f"Input Schema Validation Error: {err_msg}")

    # Execute prediction with latency measurement
    start_t = time.perf_counter()
    try:
        result = adapter.predict(payload.input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model Prediction Execution Error: {str(e)}")
    latency_ms = round((time.perf_counter() - start_t) * 1000, 2)

    # Log prediction request for monitoring & drift
    # Find active deployment if available
    dep = db.query(Deployment).filter(Deployment.model_version_id == ver.id).first()
    if not dep:
        dep = Deployment(
            project_id=model.project_id,
            model_version_id=ver.id,
            deployment_name=f"{model.name}-auto-deployment",
            status="Active",
            endpoint_url=f"/api/models/{model.id}/predict"
        )
        db.add(dep)
        db.commit()
        db.refresh(dep)

    pred_log = PredictionLog(
        deployment_id=dep.id,
        model_version_id=ver.id,
        input_data=payload.input_data if isinstance(payload.input_data, (dict, list)) else {"raw_input": str(payload.input_data)},
        prediction_output=result,
        latency_ms=latency_ms
    )
    db.add(pred_log)
    db.commit()

    return PredictResponse(
        prediction=result.get("prediction"),
        probabilities=result.get("probabilities"),
        model_version=ver.version,
        deployment_id=dep.id,
        latency_ms=latency_ms
    )

@router.post("/deployments/{deployment_id}/predict", response_model=PredictResponse)
def predict_deployment(
    deployment_id: str,
    payload: PredictRequest,
    db: Session = Depends(get_db)
):
    dep = db.query(Deployment).filter(
        (Deployment.id == deployment_id) | (Deployment.deployment_name == deployment_id)
    ).first()

    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")

    ver = db.query(ModelVersion).filter(ModelVersion.id == dep.model_version_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Deployed model version not found")

    model = db.query(Model).filter(Model.id == ver.model_id).first()

    adapter = get_model_adapter(
        framework=model.framework if model else "sklearn",
        artifact_path=ver.artifact_path,
        input_schema=ver.input_schema,
        output_schema=ver.output_schema
    )

    is_valid, err_msg = adapter.validate_input(payload.input_data)
    if not is_valid:
        raise HTTPException(status_code=422, detail=f"Input Schema Validation Error: {err_msg}")

    start_t = time.perf_counter()
    result = adapter.predict(payload.input_data)
    latency_ms = round((time.perf_counter() - start_t) * 1000, 2)

    pred_log = PredictionLog(
        deployment_id=dep.id,
        model_version_id=ver.id,
        input_data=payload.input_data if isinstance(payload.input_data, (dict, list)) else {"raw_input": str(payload.input_data)},
        prediction_output=result,
        latency_ms=latency_ms
    )
    db.add(pred_log)
    db.commit()

    return PredictResponse(
        prediction=result.get("prediction"),
        probabilities=result.get("probabilities"),
        model_version=ver.version,
        deployment_id=dep.id,
        latency_ms=latency_ms
    )

@router.post("/predictions/ground-truth")
def log_ground_truth(
    payload: GroundTruthLog,
    db: Session = Depends(get_db)
):
    log = db.query(PredictionLog).filter(PredictionLog.id == payload.prediction_log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Prediction log not found")

    log.actual_label = payload.actual_label
    db.commit()

    return {"message": "Ground truth label recorded successfully for performance evaluation."}
