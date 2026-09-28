import os
import mlflow
from typing import Any, Dict, Optional
from app.core.config import settings

class MLflowService:
    """
    MLflow tracking service wrapper to log experiments, hyper-parameters, metrics, and artifacts.
    """

    def __init__(self):
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        try:
            mlflow.set_experiment(settings.MLFLOW_EXPERIMENT_NAME)
        except Exception:
            pass

    def start_run(self, run_name: str) -> str:
        run = mlflow.start_run(run_name=run_name)
        return run.info.run_id

    def log_run(
        self,
        run_name: str,
        parameters: Optional[Dict[str, Any]] = None,
        metrics: Optional[Dict[str, float]] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> str:
        try:
            with mlflow.start_run(run_name=run_name) as run:
                if parameters:
                    for k, v in parameters.items():
                        mlflow.log_param(k, str(v))
                if metrics:
                    for k, v in metrics.items():
                        mlflow.log_metric(k, float(v))
                if tags:
                    mlflow.set_tags(tags)
                return run.info.run_id
        except Exception as e:
            # Fallback mock run ID if MLflow server unavailable
            import uuid
            return f"mock-mlflow-run-{uuid.uuid4().hex[:8]}"

mlflow_service = MLflowService()
