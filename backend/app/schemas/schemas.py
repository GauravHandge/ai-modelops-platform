from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth & User
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    organization_name: Optional[str] = "Default Organization"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    organization_id: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    organization_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Project
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    organization_id: Optional[str] = None
    created_by_id: Optional[str] = None
    created_at: datetime
    model_count: Optional[int] = 0
    experiment_count: Optional[int] = 0
    active_deployments: Optional[int] = 0

    class Config:
        from_attributes = True

# Model Registration
class ModelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    framework: str # Scikit-learn, XGBoost, PyTorch, Custom
    model_type: str # Classification, Regression, Computer Vision
    project_id: str
    evaluation_metric: Optional[str] = "F1"
    evaluation_threshold: Optional[float] = 0.85

class ModelOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    framework: str
    model_type: str
    project_id: str
    evaluation_metric: str
    evaluation_threshold: float
    created_at: datetime
    latest_version: Optional[str] = None
    production_version: Optional[str] = None

    class Config:
        from_attributes = True

# Model Versioning
class ModelVersionCreate(BaseModel):
    model_id: str
    version: str # e.g. "1.0"
    artifact_path: str
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    dependencies: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, float]] = None
    parameters: Optional[Dict[str, Any]] = None
    dataset_version_id: Optional[str] = None
    experiment_id: Optional[str] = None

class ModelVersionOut(BaseModel):
    id: str
    model_id: str
    version: str
    artifact_path: str
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    dependencies: Optional[Dict[str, Any]] = None
    stage: str
    metrics: Optional[Dict[str, float]] = None
    parameters: Optional[Dict[str, Any]] = None
    dataset_version_id: Optional[str] = None
    experiment_id: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ModelPromoteRequest(BaseModel):
    stage: str # Staging, Production, Archived
    reason: Optional[str] = None

# Experiment Tracking
class ExperimentCreate(BaseModel):
    name: str
    project_id: str
    model_name: str
    framework: str
    dataset_version: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, float]] = None
    training_duration_seconds: Optional[float] = None
    mlflow_run_id: Optional[str] = None
    notes: Optional[str] = None

class ExperimentOut(BaseModel):
    id: str
    name: str
    project_id: str
    model_name: str
    framework: str
    dataset_version: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, float]] = None
    training_duration_seconds: Optional[float] = None
    mlflow_run_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Dataset Versioning
class DatasetVersionCreate(BaseModel):
    project_id: str
    name: str
    version: str
    dvc_hash: Optional[str] = None
    data_uri: Optional[str] = None
    schema_def: Optional[Dict[str, Any]] = None
    row_count: Optional[int] = None
    feature_stats: Optional[Dict[str, Any]] = None # Baseline distributions

class DatasetVersionOut(BaseModel):
    id: str
    project_id: str
    name: str
    version: str
    dvc_hash: Optional[str] = None
    data_uri: Optional[str] = None
    schema_def: Optional[Dict[str, Any]] = None
    row_count: Optional[int] = None
    feature_stats: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Deployment
class DeploymentCreate(BaseModel):
    project_id: str
    model_version_id: str
    deployment_name: str

class DeploymentOut(BaseModel):
    id: str
    project_id: str
    model_version_id: str
    deployment_name: str
    status: str
    endpoint_url: str
    created_at: datetime
    model_version: Optional[ModelVersionOut] = None

    class Config:
        from_attributes = True

# Prediction API
class PredictRequest(BaseModel):
    input_data: Any # JSON dictionary of features OR list of objects OR image base64/tensor array

class PredictResponse(BaseModel):
    prediction: Any
    probabilities: Optional[Any] = None
    model_version: str
    deployment_id: Optional[str] = None
    latency_ms: float

# Ground Truth Log
class GroundTruthLog(BaseModel):
    prediction_log_id: str
    actual_label: Any

# Monitoring & Drift
class DriftCheckRequest(BaseModel):
    model_version_id: str
    production_data: List[Dict[str, Any]]

class DriftEventOut(BaseModel):
    id: str
    model_version_id: str
    feature_name: str
    drift_score: float
    p_value: Optional[float] = None
    drift_detected: bool
    details: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Summary
class DashboardMetrics(BaseModel):
    total_projects: int
    registered_models: int
    total_experiments: int
    production_models: int
    active_deployments: int
    open_drift_alerts: int
