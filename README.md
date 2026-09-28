# AI ModelOps Platform

> A production-oriented, model-agnostic MLOps platform for ML model registration, versioning, dynamic prediction serving, drift detection, and lifecycle management.

---

## 🌟 Key Features

* **Model-Agnostic Engine**: Standard abstract `ModelAdapter` interface supporting **Scikit-Learn**, **XGBoost**, **PyTorch**, and custom Python models.
* **Dynamic Prediction API**: Real-time HTTP prediction endpoint that dynamically loads model artifacts and validates payloads against Pydantic-backed schemas at runtime.
* **Model Versioning & Promotion**: Multi-stage promotion matrix (`Development` -> `Staging` -> `Production`) enforced by customizable evaluation threshold metrics (F1, Accuracy, RMSE, R2).
* **1-Click Rollback**: Instant automated rollback of Production model deployments to prior stable releases.
* **Statistical Data Drift Engine**: Detection of feature distribution shifts using **Kolmogorov-Smirnov (KS-test)** and **Population Stability Index (PSI)** with 1-click automated retraining triggers.
* **Modern Dashboard**: Next.js 14+ frontend built with Tailwind CSS and dark glassmorphic design system.
* **Experiment & Dataset Lineage**: Integrated MLflow experiment logging and DVC dataset hash traceability.
* **Full Docker Orchestration**: Multi-container setup with FastAPI, Next.js, PostgreSQL, MLflow, Prometheus, and Grafana.

---

## 🏗 System Architecture

```
                       USER / FRONTEND (Next.js 14)
                                   |
                                   v
                      FastAPI Master API Router
                                   |
    +------------------------------+------------------------------+
    |                              |                              |
    v                              v                              v
Model Registry              Dynamic Prediction           Drift & Monitoring
(Versions & Thresholds)    (Framework Adapters)         (KS-Test & PSI Engine)
    |                              |                              |
    v                              v                              v
PostgreSQL / SQLite         Storage (.joblib/.pt)        Prediction Logs & Alerts
```

---

## 🛠 Quickstart Guide

### Option 1: Local Development

1. **Install Backend Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Backend Server**:
   ```bash
   python backend/main.py
   # API runs at http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
   ```

3. **Install & Run Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   # Dashboard runs at http://localhost:3000
   ```

### Option 2: Docker Compose Orchestration

```bash
docker-compose up --build
```
* **Frontend Dashboard**: `http://localhost:3000`
* **FastAPI Backend**: `http://localhost:8000`
* **MLflow Tracking UI**: `http://localhost:5000`
* **Prometheus Metrics**: `http://localhost:9090`
* **Grafana Operational Dashboard**: `http://localhost:3001`

---

## 🧪 Running Automated Tests & Pipelines

```bash
# Run backend pytest suite (100% pass)
python -m pytest tests/ -v

# Train and register Customer Churn demo model
python examples/churn/train_churn.py
```

---

## 📋 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | User registration & tenant provisioning |
| `/api/auth/login` | `POST` | OAuth2 Bearer token authentication |
| `/api/projects` | `GET/POST` | Workspace project management |
| `/api/models` | `GET/POST` | Central model registry |
| `/api/models/versions/{id}/promote` | `POST` | Model promotion (Dev -> Staging -> Prod) |
| `/api/models/{id}/rollback` | `POST` | 1-Click Production rollback |
| `/api/models/{id}/predict` | `POST` | Dynamic inference prediction |
| `/api/drift/check` | `POST` | Calculate Kolmogorov-Smirnov statistical drift |
| `/api/drift/events/{id}/retrain` | `POST` | Trigger automated model retraining |

---

## 📄 License
MIT License
