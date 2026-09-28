from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.db.models import Project, Model, Experiment, Deployment, User
from app.schemas.schemas import ProjectCreate, ProjectOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectOut)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Project).filter(Project.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project '{payload.name}' already exists.")

    proj = Project(
        name=payload.name,
        description=payload.description,
        organization_id=current_user.organization_id if current_user else None,
        created_by_id=current_user.id if current_user else None
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    
    return ProjectOut(
        id=proj.id,
        name=proj.name,
        description=proj.description,
        organization_id=proj.organization_id,
        created_by_id=proj.created_by_id,
        created_at=proj.created_at,
        model_count=0,
        experiment_count=0,
        active_deployments=0
    )

@router.get("", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).all()
    results = []
    for p in projects:
        m_count = db.query(Model).filter(Model.project_id == p.id).count()
        e_count = db.query(Experiment).filter(Experiment.project_id == p.id).count()
        d_count = db.query(Deployment).filter(Deployment.project_id == p.id, Deployment.status == "Active").count()
        results.append(ProjectOut(
            id=p.id,
            name=p.name,
            description=p.description,
            organization_id=p.organization_id,
            created_by_id=p.created_by_id,
            created_at=p.created_at,
            model_count=m_count,
            experiment_count=e_count,
            active_deployments=d_count
        ))
    return results

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    m_count = db.query(Model).filter(Model.project_id == p.id).count()
    e_count = db.query(Experiment).filter(Experiment.project_id == p.id).count()
    d_count = db.query(Deployment).filter(Deployment.project_id == p.id, Deployment.status == "Active").count()

    return ProjectOut(
        id=p.id,
        name=p.name,
        description=p.description,
        organization_id=p.organization_id,
        created_by_id=p.created_by_id,
        created_at=p.created_at,
        model_count=m_count,
        experiment_count=e_count,
        active_deployments=d_count
    )

@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(p)
    db.commit()
    return {"message": f"Project '{p.name}' deleted successfully."}
