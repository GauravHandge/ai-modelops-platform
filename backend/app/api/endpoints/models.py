from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
import json
from app.db.session import get_db
from app.db.models import Model, ModelVersion, ModelEvent, User
from app.schemas.schemas import (
    ModelCreate, ModelOut, ModelVersionCreate, ModelVersionOut, ModelPromoteRequest
)
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/models", tags=["Model Registry & Versioning"])

@router.post("/{model_id}/versions/upload", response_model=ModelVersionOut)
def upload_model_version(
    model_id: str,
    file: UploadFile = File(...),
    version: str = Form("1.0"),
    stage: str = Form("Development"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    existing_ver = db.query(ModelVersion).filter(ModelVersion.model_id == model_id, ModelVersion.version == version).first()
    if existing_ver:
        raise HTTPException(status_code=400, detail=f"Version '{version}' already exists for model '{model.name}'.")

    storage_dir = os.path.abspath(os.path.join("storage", "models", model_id))
    os.makedirs(storage_dir, exist_ok=True)
    
    file_path = os.path.join(storage_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ver = ModelVersion(
        model_id=model_id,
        version=version,
        artifact_path=file_path,
        stage=stage,
        status="Active"
    )
    db.add(ver)
    db.commit()
    db.refresh(ver)

    evt = ModelEvent(
        model_version_id=ver.id,
        event_type="Registered",
        message=f"Model artifact '{file.filename}' uploaded as version {ver.version}.",
        created_by_id=current_user.id if current_user else None
    )
    db.add(evt)
    db.commit()

    return ver

@router.post("", response_model=ModelOut)
def register_model(
    payload: ModelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Model).filter(Model.project_id == payload.project_id, Model.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Model '{payload.name}' already registered in this project.")

    model = Model(
        name=payload.name,
        description=payload.description,
        framework=payload.framework,
        model_type=payload.model_type,
        project_id=payload.project_id,
        owner_id=current_user.id if current_user else None,
        evaluation_metric=payload.evaluation_metric or "F1",
        evaluation_threshold=payload.evaluation_threshold if payload.evaluation_threshold is not None else 0.85
    )
    db.add(model)
    db.commit()
    db.refresh(model)

    return ModelOut(
        id=model.id,
        name=model.name,
        description=model.description,
        framework=model.framework,
        model_type=model.model_type,
        project_id=model.project_id,
        evaluation_metric=model.evaluation_metric,
        evaluation_threshold=model.evaluation_threshold,
        created_at=model.created_at,
        latest_version=None,
        production_version=None
    )

@router.get("", response_model=List[ModelOut])
def list_models(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Model)
    if project_id:
        query = query.filter(Model.project_id == project_id)
    models = query.all()

    results = []
    for m in models:
        latest = db.query(ModelVersion).filter(ModelVersion.model_id == m.id).order_by(ModelVersion.created_at.desc()).first()
        prod = db.query(ModelVersion).filter(ModelVersion.model_id == m.id, ModelVersion.stage == "Production").first()

        results.append(ModelOut(
            id=m.id,
            name=m.name,
            description=m.description,
            framework=m.framework,
            model_type=m.model_type,
            project_id=m.project_id,
            evaluation_metric=m.evaluation_metric,
            evaluation_threshold=m.evaluation_threshold,
            created_at=m.created_at,
            latest_version=latest.version if latest else None,
            production_version=prod.version if prod else None
        ))
    return results

@router.get("/{model_id}", response_model=ModelOut)
def get_model(
    model_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    m = db.query(Model).filter(Model.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")

    latest = db.query(ModelVersion).filter(ModelVersion.model_id == m.id).order_by(ModelVersion.created_at.desc()).first()
    prod = db.query(ModelVersion).filter(ModelVersion.model_id == m.id, ModelVersion.stage == "Production").first()

    return ModelOut(
        id=m.id,
        name=m.name,
        description=m.description,
        framework=m.framework,
        model_type=m.model_type,
        project_id=m.project_id,
        evaluation_metric=m.evaluation_metric,
        evaluation_threshold=m.evaluation_threshold,
        created_at=m.created_at,
        latest_version=latest.version if latest else None,
        production_version=prod.version if prod else None
    )

@router.post("/{model_id}/versions", response_model=ModelVersionOut)
def create_model_version(
    model_id: str,
    payload: ModelVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    existing_ver = db.query(ModelVersion).filter(ModelVersion.model_id == model_id, ModelVersion.version == payload.version).first()
    if existing_ver:
        raise HTTPException(status_code=400, detail=f"Version '{payload.version}' already exists for model '{model.name}'.")

    ver = ModelVersion(
        model_id=model_id,
        version=payload.version,
        artifact_path=payload.artifact_path,
        input_schema=payload.input_schema,
        output_schema=payload.output_schema,
        dependencies=payload.dependencies,
        stage="Development",
        metrics=payload.metrics,
        parameters=payload.parameters,
        dataset_version_id=payload.dataset_version_id,
        experiment_id=payload.experiment_id,
        status="Active"
    )
    db.add(ver)
    db.commit()
    db.refresh(ver)

    # Log model registration event
    evt = ModelEvent(
        model_version_id=ver.id,
        event_type="Registered",
        message=f"Model version {ver.version} registered in Development stage.",
        created_by_id=current_user.id if current_user else None
    )
    db.add(evt)
    db.commit()

    return ver

@router.get("/{model_id}/versions", response_model=List[ModelVersionOut])
def list_model_versions(
    model_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    versions = db.query(ModelVersion).filter(ModelVersion.model_id == model_id).order_by(ModelVersion.created_at.desc()).all()
    return versions

@router.post("/versions/{version_id}/promote", response_model=ModelVersionOut)
def promote_model_version(
    version_id: str,
    payload: ModelPromoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ver = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Model version not found")

    model = db.query(Model).filter(Model.id == ver.model_id).first()

    # If promoting to Production, evaluate metrics threshold!
    if payload.stage == "Production":
        metric_key = model.evaluation_metric.lower()
        threshold = model.evaluation_threshold
        
        ver_metrics = ver.metrics or {}
        # Match metric case-insensitively
        val = None
        for k, v in ver_metrics.items():
            if k.lower() == metric_key or metric_key in k.lower():
                val = float(v)
                break

        if val is not None and val < threshold:
            raise HTTPException(
                status_code=400,
                detail=f"Promotion Rejected: {model.evaluation_metric} score ({val}) does not meet the required threshold ({threshold}) for Production stage."
            )

        # Archive/demote previous Production version for this model
        prev_prods = db.query(ModelVersion).filter(
            ModelVersion.model_id == ver.model_id,
            ModelVersion.stage == "Production",
            ModelVersion.id != ver.id
        ).all()
        for p in prev_prods:
            p.stage = "Archived"

    old_stage = ver.stage
    ver.stage = payload.stage
    db.commit()
    db.refresh(ver)

    evt = ModelEvent(
        model_version_id=ver.id,
        event_type="Promoted",
        message=f"Model version {ver.version} promoted from {old_stage} to {ver.stage}. Reason: {payload.reason or 'Manual promotion'}",
        created_by_id=current_user.id if current_user else None
    )
    db.add(evt)
    db.commit()

    return ver

@router.post("/{model_id}/rollback")
def rollback_model(
    model_id: str,
    target_version: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    current_prod = db.query(ModelVersion).filter(ModelVersion.model_id == model_id, ModelVersion.stage == "Production").first()
    
    if target_version:
        target_ver = db.query(ModelVersion).filter(ModelVersion.model_id == model_id, ModelVersion.version == target_version).first()
    else:
        # Pick previous non-production version sorted by creation time
        target_ver = db.query(ModelVersion).filter(
            ModelVersion.model_id == model_id,
            ModelVersion.id != (current_prod.id if current_prod else "")
        ).order_by(ModelVersion.created_at.desc()).first()

    if not target_ver:
        raise HTTPException(status_code=400, detail="No previous stable version available for rollback.")

    if current_prod:
        current_prod.stage = "Archived"
    
    target_ver.stage = "Production"
    db.commit()

    evt = ModelEvent(
        model_version_id=target_ver.id,
        event_type="RolledBack",
        message=f"Rolled back model '{model.name}' to version {target_ver.version}." + (f" Demoted V{current_prod.version}." if current_prod else ""),
        created_by_id=current_user.id if current_user else None
    )
    db.add(evt)
    db.commit()

    return {
        "message": f"Successfully rolled back model '{model.name}' to version {target_ver.version}.",
        "active_production_version": target_ver.version
    }
