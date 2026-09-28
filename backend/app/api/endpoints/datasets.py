from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.db.models import DatasetVersion, User
from app.schemas.schemas import DatasetVersionCreate, DatasetVersionOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/datasets", tags=["Dataset Versioning & Traceability"])

@router.post("", response_model=DatasetVersionOut)
def create_dataset_version(
    payload: DatasetVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(DatasetVersion).filter(
        DatasetVersion.project_id == payload.project_id,
        DatasetVersion.name == payload.name,
        DatasetVersion.version == payload.version
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Dataset version {payload.version} already exists for '{payload.name}'.")

    ds = DatasetVersion(
        project_id=payload.project_id,
        name=payload.name,
        version=payload.version,
        dvc_hash=payload.dvc_hash,
        data_uri=payload.data_uri,
        schema_def=payload.schema_def,
        row_count=payload.row_count,
        feature_stats=payload.feature_stats
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds

@router.get("", response_model=List[DatasetVersionOut])
def list_dataset_versions(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DatasetVersion)
    if project_id:
        query = query.filter(DatasetVersion.project_id == project_id)
    return query.order_by(DatasetVersion.created_at.desc()).all()

@router.get("/{dataset_id}", response_model=DatasetVersionOut)
def get_dataset_version(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ds = db.query(DatasetVersion).filter(DatasetVersion.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset version not found")
    return ds
