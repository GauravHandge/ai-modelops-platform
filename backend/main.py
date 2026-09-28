import os
import sys

# Ensure root directory and backend directory are in sys.path for direct python execution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.api.api import api_router

# Create database tables automatically for SQLite local dev
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A production-oriented, model-agnostic AI ModelOps Platform API.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "healthy",
        "documentation": "/docs",
        "api_prefix": "/api"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8005))
    uvicorn.run("backend.main:app" if os.path.exists("backend") else "main:app", host="0.0.0.0", port=port, reload=True)
