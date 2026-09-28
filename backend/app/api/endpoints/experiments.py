from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.db.models import Experiment, User
from app.schemas.schemas import ExperimentCreate, ExperimentOut
from app.api.deps import get_current_user
from app.services.mlflow_service import mlflow_service

router = APIRouter(prefix="/experiments", tags=["Experiment Tracking"])

@router.post("", response_model=ExperimentOut)
def create_experiment(
    payload: ExperimentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Log to MLflow
    run_id = mlflow_service.log_run(
        run_name=payload.name,
        parameters=payload.parameters,
        metrics=payload.metrics,
        tags={"framework": payload.framework, "model": payload.model_name}
    )

    exp = Experiment(
        name=payload.name,
        project_id=payload.project_id,
        model_name=payload.model_name,
        framework=payload.framework,
        dataset_version=payload.dataset_version,
        parameters=payload.parameters,
        metrics=payload.metrics,
        training_duration_seconds=payload.training_duration_seconds,
        mlflow_run_id=payload.mlflow_run_id or run_id,
        notes=payload.notes
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

@router.get("", response_model=List[ExperimentOut])
def list_experiments(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Experiment)
    if project_id:
        query = query.filter(Experiment.project_id == project_id)
    return query.order_by(Experiment.created_at.desc()).all()

@router.get("/{experiment_id}", response_model=ExperimentOut)
def get_experiment(
    experiment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp
