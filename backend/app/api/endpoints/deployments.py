from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.db.models import Deployment, ModelVersion, Project, User
from app.schemas.schemas import DeploymentCreate, DeploymentOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/deployments", tags=["Deployments"])

@router.post("", response_model=DeploymentOut)
def create_deployment(
    payload: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ver = db.query(ModelVersion).filter(ModelVersion.id == payload.model_version_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Model version not found")

    dep = Deployment(
        project_id=payload.project_id,
        model_version_id=payload.model_version_id,
        deployment_name=payload.deployment_name,
        status="Active",
        endpoint_url=f"/api/deployments/predict/{payload.deployment_name}"
    )
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return dep

@router.get("", response_model=List[DeploymentOut])
def list_deployments(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Deployment)
    if project_id:
        query = query.filter(Deployment.project_id == project_id)
    return query.order_by(Deployment.created_at.desc()).all()

@router.get("/{deployment_id}", response_model=DeploymentOut)
def get_deployment(
    deployment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return dep

@router.delete("/{deployment_id}")
def delete_deployment(
    deployment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")
    db.delete(dep)
    db.commit()
    return {"message": "Deployment deleted successfully."}
