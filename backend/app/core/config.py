import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI ModelOps Platform"
    ENV: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./modelops.db"
    
    SECRET_KEY: str = "modelops-super-secret-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    MLFLOW_TRACKING_URI: str = "./mlflow_artifacts"
    MLFLOW_EXPERIMENT_NAME: str = "modelops_experiments"

    MODEL_STORE_DIR: str = "./storage/models"
    DATASET_STORE_DIR: str = "./storage/datasets"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

os.makedirs(settings.MODEL_STORE_DIR, exist_ok=True)
os.makedirs(settings.DATASET_STORE_DIR, exist_ok=True)
os.makedirs(settings.MLFLOW_TRACKING_URI, exist_ok=True)
