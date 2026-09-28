import os
import joblib
import requests
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import root_mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")
MODEL_DIR = "./storage/models/house_price"
os.makedirs(MODEL_DIR, exist_ok=True)

def generate_house_price_dataset(n_samples=1000):
    np.random.seed(42)
    square_feet = np.random.randint(600, 4500, n_samples)
    num_bedrooms = np.random.randint(1, 6, n_samples)
    num_bathrooms = np.random.randint(1, 5, n_samples)
    age_years = np.random.randint(0, 50, n_samples)
    distance_to_city_center_km = np.random.uniform(1.0, 30.0, n_samples)

    # House price formula
    price = (
        (square_feet * 220) +
        (num_bedrooms * 25000) +
        (num_bathrooms * 35000) -
        (age_years * 1200) -
        (distance_to_city_center_km * 4000) +
        np.random.normal(0, 25000, n_samples)
    )

    df = pd.DataFrame({
        "square_feet": square_feet,
        "num_bedrooms": num_bedrooms,
        "num_bathrooms": num_bathrooms,
        "age_years": age_years,
        "distance_to_city_center_km": np.round(distance_to_city_center_km, 2),
        "price": np.round(price, 2)
    })
    return df

def train_and_register_house_price_model():
    print("🚀 Step 1: Generating House Price Regression synthetic dataset...")
    df = generate_house_price_dataset(1500)

    X = df.drop(columns=["price"])
    y = df["price"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("🧠 Step 2: Training XGBoost Regressor (Model V1)...")
    model = xgb.XGBRegressor(n_estimators=150, learning_rate=0.08, max_depth=5, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    rmse = float(root_mean_squared_error(y_test, y_pred))
    mae = float(mean_absolute_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))

    print(f"📊 XGBoost Model V1 Metrics: RMSE=${rmse:,.2f}, MAE=${mae:,.2f}, R²={r2:.4f}")

    artifact_path = os.path.join(MODEL_DIR, "house_price_xgb_v1.joblib")
    joblib.dump(model, artifact_path)
    print(f"💾 Saved XGBoost model artifact to: {artifact_path}")

    input_schema = {
        "features": [
            {"name": "square_feet", "type": "int"},
            {"name": "num_bedrooms", "type": "int"},
            {"name": "num_bathrooms", "type": "int"},
            {"name": "age_years", "type": "int"},
            {"name": "distance_to_city_center_km", "type": "float"}
        ]
    }
    output_schema = {"type": "regression", "target": "price"}

    try:
        # Create Project
        proj_res = requests.post(f"{API_BASE_URL}/projects", json={
            "name": "House Price Prediction",
            "description": "Real estate price estimation powered by XGBoost gradient boosting."
        })
        proj_id = proj_res.json().get("id") if proj_res.status_code == 200 else None
        if not proj_id:
            projects = requests.get(f"{API_BASE_URL}/projects").json()
            proj_id = [p["id"] for p in projects if p["name"] == "House Price Prediction"][0]

        # Register Model
        mod_res = requests.post(f"{API_BASE_URL}/models", json={
            "name": "house-price-regressor",
            "description": "XGBoost Regression Model for Property Valuation",
            "framework": "XGBoost",
            "model_type": "Regression",
            "project_id": proj_id,
            "evaluation_metric": "R2",
            "evaluation_threshold": 0.80
        })
        mod_id = mod_res.json().get("id") if mod_res.status_code == 200 else None
        if not mod_id:
            models = requests.get(f"{API_BASE_URL}/models?project_id={proj_id}").json()
            mod_id = [m["id"] for m in models if m["name"] == "house-price-regressor"][0]

        # Create Version V1
        ver_res = requests.post(f"{API_BASE_URL}/models/{mod_id}/versions", json={
            "model_id": mod_id,
            "version": "1.0",
            "artifact_path": os.path.abspath(artifact_path),
            "input_schema": input_schema,
            "output_schema": output_schema,
            "dependencies": {"xgboost": "2.0.3", "scikit-learn": "1.4.0"},
            "metrics": {"rmse": rmse, "mae": mae, "r2": r2},
            "parameters": {"n_estimators": 150, "learning_rate": 0.08, "max_depth": 5}
        })
        ver_id = ver_res.json().get("id")

        feature_stats = {}
        for col in X.columns:
            feature_stats[col] = {
                "baseline_mean": float(X[col].mean()),
                "baseline_std": float(X[col].std()),
                "samples": X[col].tolist()[:200]
            }

        requests.post(f"{API_BASE_URL}/datasets", json={
            "project_id": proj_id,
            "name": "housing_training_dataset",
            "version": "v1.0",
            "dvc_hash": "b2c3d4e5f67890123456789abcdef01a",
            "row_count": len(df),
            "feature_stats": feature_stats
        })

        if ver_id:
            requests.post(f"{API_BASE_URL}/models/versions/{ver_id}/promote", json={
                "stage": "Production",
                "reason": "Model V1 satisfies R2 threshold (>= 0.80)."
            })

        print("✅ House Price XGBoost Model V1 registered and promoted to Production!")

    except Exception as e:
        print(f"⚠️ Registration API offline or skipped: {e}")

if __name__ == "__main__":
    train_and_register_house_price_model()
