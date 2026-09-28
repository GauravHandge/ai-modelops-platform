from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from app.db.session import get_db
from app.db.models import (
    Project, Model, ModelVersion, Deployment, PredictionLog, MonitoringMetric, DriftEvent, User
)
from app.schemas.schemas import DashboardMetrics
from app.api.deps import get_current_user

router = APIRouter(prefix="/monitoring", tags=["Monitoring & Performance"])

@router.get("/dashboard-summary", response_model=DashboardMetrics)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_projects = db.query(Project).count()
    registered_models = db.query(Model).count()
    total_experiments = db.query(ModelVersion).count() # Or total experiments
    production_models = db.query(ModelVersion).filter(ModelVersion.stage == "Production").count()
    active_deployments = db.query(Deployment).filter(Deployment.status == "Active").count()
    open_drift_alerts = db.query(DriftEvent).filter(DriftEvent.status == "Open", DriftEvent.drift_detected == True).count()

    return DashboardMetrics(
        total_projects=total_projects,
        registered_models=registered_models,
        total_experiments=total_experiments,
        production_models=production_models,
        active_deployments=active_deployments,
        open_drift_alerts=open_drift_alerts
    )

@router.get("/logs")
def list_prediction_logs(
    deployment_id: Optional[str] = None,
    model_version_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(PredictionLog)
    if deployment_id:
        query = query.filter(PredictionLog.deployment_id == deployment_id)
    if model_version_id:
        query = query.filter(PredictionLog.model_version_id == model_version_id)

    logs = query.order_by(PredictionLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "deployment_id": l.deployment_id,
            "model_version_id": l.model_version_id,
            "input_data": l.input_data,
            "prediction_output": l.prediction_output,
            "latency_ms": l.latency_ms,
            "actual_label": l.actual_label,
            "created_at": l.created_at
        })
    return results

@router.get("/performance-metrics/{model_version_id}")
def get_model_performance(
    model_version_id: str,
    db: Session = Depends(get_db)
):
    """
    Calculate live performance metrics (Accuracy, F1, RMSE, MAE) where ground truth actual labels are present.
    """
    logs = db.query(PredictionLog).filter(
        PredictionLog.model_version_id == model_version_id,
        PredictionLog.actual_label.isnot(None)
    ).all()

    if not logs:
        return {
            "model_version_id": model_version_id,
            "evaluated_samples": 0,
            "metrics": {},
            "message": "No ground-truth labels logged yet for performance calculation."
        }

    y_true = []
    y_pred = []
    for l in logs:
        # Extract prediction output
        p = l.prediction_output
        if isinstance(p, dict):
            pred_val = p.get("prediction")
        else:
            pred_val = p

        y_pred.append(pred_val)
        y_true.append(l.actual_label)

    # Calculate metrics depending on data type
    evaluated_count = len(y_true)
    metrics_res = {}

    try:
        # Check if classification
        correct = sum(1 for t, p in zip(y_true, y_pred) if str(t) == str(p))
        accuracy = round(correct / evaluated_count, 4)
        metrics_res["accuracy"] = accuracy
    except Exception:
        pass

    try:
        # Check if numeric regression
        y_t_float = [float(x) for x in y_true if isinstance(x, (int, float))]
        y_p_float = [float(x) for x in y_pred if isinstance(x, (int, float))]
        if len(y_t_float) == evaluated_count and len(y_p_float) == evaluated_count:
            diffs = [(t - p) ** 2 for t, p in zip(y_t_float, y_p_float)]
            rmse = round(float((sum(diffs) / evaluated_count) ** 0.5), 4)
            mae = round(float(sum(abs(t - p) for t, p in zip(y_t_float, y_p_float)) / evaluated_count), 4)
            metrics_res["rmse"] = rmse
            metrics_res["mae"] = mae
    except Exception:
        pass

    return {
        "model_version_id": model_version_id,
        "evaluated_samples": evaluated_count,
        "metrics": metrics_res
    }
