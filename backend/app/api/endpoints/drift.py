from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.db.session import get_db
from app.db.models import (
    ModelVersion, DatasetVersion, PredictionLog, DriftEvent, ModelEvent, User
)
from app.schemas.schemas import DriftEventOut, DriftCheckRequest
from app.api.deps import get_current_user
from app.services.drift_engine import DriftEngine

router = APIRouter(prefix="/drift", tags=["Data Drift Engine"])

@router.post("/check", response_model=List[DriftEventOut])
def check_data_drift(
    payload: DriftCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ver = db.query(ModelVersion).filter(ModelVersion.id == payload.model_version_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Model version not found")

    # Fetch baseline stats from dataset version
    ds_ver = db.query(DatasetVersion).filter(DatasetVersion.id == ver.dataset_version_id).first() if ver.dataset_version_id else None
    baseline_stats = ds_ver.feature_stats if ds_ver and ds_ver.feature_stats else {}

    # Extract production feature values from payload or prediction logs
    prod_data = payload.production_data
    if not prod_data:
        # Fallback to recent prediction logs
        logs = db.query(PredictionLog).filter(PredictionLog.model_version_id == ver.id).order_by(PredictionLog.created_at.desc()).limit(100).all()
        prod_data = [l.input_data for l in logs if isinstance(l.input_data, dict)]

    if not prod_data:
        raise HTTPException(status_code=400, detail="No production data available for drift analysis.")

    # Identify features
    sample_item = prod_data[0]
    features = list(sample_item.keys()) if isinstance(sample_item, dict) else []

    drift_events = []
    for feat in features:
        prod_values = [row[feat] for row in prod_data if feat in row and row[feat] is not None]

        # Extract baseline feature values if present
        base_values = baseline_stats.get(feat, {}).get("samples") or baseline_stats.get(feat, {}).get("baseline_mean")
        if not base_values:
            # Generate default baseline for comparison if missing
            base_values = [prod_values[0]] * len(prod_values) if prod_values else []

        res = DriftEngine.detect_feature_drift(
            feature_name=feat,
            baseline_values=base_values if isinstance(base_values, list) else [base_values],
            production_values=prod_values
        )

        if res["drift_detected"]:
            # Record or update drift event in database
            evt = DriftEvent(
                model_version_id=ver.id,
                feature_name=feat,
                drift_score=res["drift_score"],
                p_value=res.get("p_value"),
                drift_detected=True,
                details=res.get("details"),
                status="Open"
            )
            db.add(evt)
            db.commit()
            db.refresh(evt)
            drift_events.append(evt)

    return drift_events

@router.get("/events", response_model=List[DriftEventOut])
def list_drift_events(
    model_version_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DriftEvent)
    if model_version_id:
        query = query.filter(DriftEvent.model_version_id == model_version_id)
    if status:
        query = query.filter(DriftEvent.status == status)
    return query.order_by(DriftEvent.created_at.desc()).all()

@router.post("/events/{event_id}/acknowledge")
def acknowledge_drift_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evt = db.query(DriftEvent).filter(DriftEvent.id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Drift event not found")
    evt.status = "Acknowledged"
    db.commit()
    return {"message": f"Drift event for feature '{evt.feature_name}' acknowledged."}

@router.post("/events/{event_id}/trigger-retraining")
def trigger_retraining(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evt = db.query(DriftEvent).filter(DriftEvent.id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Drift event not found")

    evt.status = "RetrainingTriggered"
    
    model_evt = ModelEvent(
        model_version_id=evt.model_version_id,
        event_type="RetrainingTriggered",
        message=f"Retraining workflow initiated due to data drift detected in feature '{evt.feature_name}' (Drift score: {evt.drift_score}).",
        created_by_id=current_user.id if current_user else None
    )
    db.add(model_evt)
    db.commit()

    return {
        "message": f"Retraining workflow successfully triggered for model version {evt.model_version_id}.",
        "recommended_action": "Create new experiment run with updated dataset version."
    }
