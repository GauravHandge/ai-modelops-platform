from fastapi import APIRouter
from app.api.endpoints import (
    auth, projects, models, experiments, datasets, deployments, predictions, monitoring, drift
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(models.router)
api_router.include_router(experiments.router)
api_router.include_router(datasets.router)
api_router.include_router(deployments.router)
api_router.include_router(predictions.router)
api_router.include_router(monitoring.router)
api_router.include_router(drift.router)
