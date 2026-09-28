from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="engineer") # admin, engineer, viewer
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="users")
    projects_created = relationship("Project", back_populates="creator")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="projects")
    creator = relationship("User", back_populates="projects_created")
    models = relationship("Model", back_populates="project", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="project", cascade="all, delete-orphan")
    dataset_versions = relationship("DatasetVersion", back_populates="project", cascade="all, delete-orphan")
    deployments = relationship("Deployment", back_populates="project", cascade="all, delete-orphan")

class Model(Base):
    __tablename__ = "models"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    framework = Column(String, nullable=False) # Scikit-learn, XGBoost, PyTorch, Custom
    model_type = Column(String, nullable=False) # Classification, Regression, Computer Vision
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    evaluation_metric = Column(String, default="F1") # F1, Accuracy, RMSE, MAE, Precision, Recall
    evaluation_threshold = Column(Float, default=0.85)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="models")
    versions = relationship("ModelVersion", back_populates="model", cascade="all, delete-orphan")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    model_id = Column(String, ForeignKey("models.id"), nullable=False)
    version = Column(String, nullable=False) # e.g. "1.0", "2.0"
    artifact_path = Column(String, nullable=False)
    input_schema = Column(JSON, nullable=True) # {"features": [{"name": "age", "type": "int"}]}
    output_schema = Column(JSON, nullable=True) # {"type": "classification", "labels": [0, 1]}
    dependencies = Column(JSON, nullable=True) # {"scikit-learn": "1.4.0"}
    stage = Column(String, default="Development") # Development, Testing, Staging, Production, Archived
    metrics = Column(JSON, nullable=True) # {"accuracy": 0.95, "f1": 0.92}
    parameters = Column(JSON, nullable=True)
    dataset_version_id = Column(String, ForeignKey("dataset_versions.id"), nullable=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=True)
    status = Column(String, default="Active") # Active, Failed, Archived
    created_at = Column(DateTime(timezone=True), default=utc_now)

    model = relationship("Model", back_populates="versions")
    dataset_version = relationship("DatasetVersion")
    experiment = relationship("Experiment")
    deployments = relationship("Deployment", back_populates="model_version")
    drift_events = relationship("DriftEvent", back_populates="model_version", cascade="all, delete-orphan")
    model_events = relationship("ModelEvent", back_populates="model_version", cascade="all, delete-orphan")

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    model_name = Column(String, nullable=False)
    framework = Column(String, nullable=False)
    dataset_version = Column(String, nullable=True)
    parameters = Column(JSON, nullable=True) # hyperparams
    metrics = Column(JSON, nullable=True) # evaluation metrics
    training_duration_seconds = Column(Float, nullable=True)
    mlflow_run_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="experiments")

class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False) # e.g., "churn_train_data"
    version = Column(String, nullable=False) # e.g., "v1.0"
    dvc_hash = Column(String, nullable=True)
    data_uri = Column(String, nullable=True)
    schema_def = Column(JSON, nullable=True)
    row_count = Column(Integer, nullable=True)
    feature_stats = Column(JSON, nullable=True) # Baseline statistics for drift comparison (mean, std, min, max, distributions)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="dataset_versions")

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    model_version_id = Column(String, ForeignKey("model_versions.id"), nullable=False)
    deployment_name = Column(String, nullable=False)
    status = Column(String, default="Active") # Active, Inactive, Degraded
    endpoint_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="deployments")
    model_version = relationship("ModelVersion", back_populates="deployments")
    prediction_logs = relationship("PredictionLog", back_populates="deployment", cascade="all, delete-orphan")

class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    deployment_id = Column(String, ForeignKey("deployments.id"), nullable=False)
    model_version_id = Column(String, ForeignKey("model_versions.id"), nullable=False)
    input_data = Column(JSON, nullable=False)
    prediction_output = Column(JSON, nullable=False)
    latency_ms = Column(Float, nullable=False)
    actual_label = Column(JSON, nullable=True) # Ground truth added later for performance monitoring
    created_at = Column(DateTime(timezone=True), default=utc_now)

    deployment = relationship("Deployment", back_populates="prediction_logs")

class MonitoringMetric(Base):
    __tablename__ = "monitoring_metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    model_version_id = Column(String, ForeignKey("model_versions.id"), nullable=False)
    metric_name = Column(String, nullable=False) # e.g. "latency_p95", "throughput", "f1_score", "rmse"
    metric_value = Column(Float, nullable=False)
    window_start = Column(DateTime(timezone=True), nullable=True)
    window_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class DriftEvent(Base):
    __tablename__ = "drift_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    model_version_id = Column(String, ForeignKey("model_versions.id"), nullable=False)
    feature_name = Column(String, nullable=False)
    drift_score = Column(Float, nullable=False) # KS-statistic or PSI value
    p_value = Column(Float, nullable=True)
    drift_detected = Column(Boolean, default=True)
    details = Column(JSON, nullable=True) # Baseline mean vs production mean, etc.
    status = Column(String, default="Open") # Open, Acknowledged, Resolved, RetrainingTriggered
    created_at = Column(DateTime(timezone=True), default=utc_now)

    model_version = relationship("ModelVersion", back_populates="drift_events")

class ModelEvent(Base):
    __tablename__ = "model_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    model_version_id = Column(String, ForeignKey("model_versions.id"), nullable=False)
    event_type = Column(String, nullable=False) # Registered, Promoted, RolledBack, RetrainingTriggered
    message = Column(Text, nullable=False)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    model_version = relationship("ModelVersion", back_populates="model_events")
