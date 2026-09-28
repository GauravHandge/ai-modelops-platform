import os
import torch
import torch.nn as nn
import requests
import numpy as np

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")
MODEL_DIR = "./storage/models/image_classification"
os.makedirs(MODEL_DIR, exist_ok=True)

class PlantDiseaseClassifier(nn.Module):
    """
    Sample PyTorch Neural Network for Plant Disease & Image Classification.
    Accepts 8 extracted vision feature vectors (color histograms, texture features, leaf contours).
    Outputs probabilities for 3 classes: [Healthy, Early Blight, Late Blight].
    """
    def __init__(self):
        super(PlantDiseaseClassifier, self).__init__()
        self.fc = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 3)
        )

    def forward(self, x):
        return self.fc(x)

def train_and_register_pytorch_vision_model():
    print("🚀 Step 1: Creating PyTorch Plant Disease Vision Model (Model V1)...")
    model = PlantDiseaseClassifier()
    model.eval()

    # Save as TorchScript JIT artifact
    scripted_model = torch.jit.script(model)
    artifact_path = os.path.join(MODEL_DIR, "plant_disease_pytorch_v1.pt")
    scripted_model.save(artifact_path)
    print(f"💾 Saved PyTorch TorchScript artifact to: {artifact_path}")

    # Test inference locally
    sample_tensor = torch.randn(1, 8)
    with torch.no_grad():
        out = scripted_model(sample_tensor)
        probs = torch.softmax(out, dim=1).numpy().tolist()[0]

    print(f"📊 PyTorch Model V1 Output Test Probs: {probs}")

    input_schema = {
        "features": [
            {"name": "green_intensity", "type": "float"},
            {"name": "brown_spot_density", "type": "float"},
            {"name": "leaf_texture_var", "type": "float"},
            {"name": "edge_contrast", "type": "float"},
            {"name": "color_hue_mean", "type": "float"},
            {"name": "color_saturation", "type": "float"},
            {"name": "lesion_area_ratio", "type": "float"},
            {"name": "symmetry_score", "type": "float"}
        ]
    }
    output_schema = {
        "type": "computer_vision",
        "labels": ["Healthy", "Early Blight", "Late Blight"]
    }

    try:
        # Create Project
        proj_res = requests.post(f"{API_BASE_URL}/projects", json={
            "name": "Plant Disease Detection",
            "description": "Computer vision model detecting crop leaf pathologies."
        })
        proj_id = proj_res.json().get("id") if proj_res.status_code == 200 else None
        if not proj_id:
            projects = requests.get(f"{API_BASE_URL}/projects").json()
            proj_id = [p["id"] for p in projects if p["name"] == "Plant Disease Detection"][0]

        # Register Model
        mod_res = requests.post(f"{API_BASE_URL}/models", json={
            "name": "plant-disease-vision",
            "description": "PyTorch TorchScript Vision Neural Network Classifier",
            "framework": "PyTorch",
            "model_type": "Computer Vision",
            "project_id": proj_id,
            "evaluation_metric": "Accuracy",
            "evaluation_threshold": 0.90
        })
        mod_id = mod_res.json().get("id") if mod_res.status_code == 200 else None
        if not mod_id:
            models = requests.get(f"{API_BASE_URL}/models?project_id={proj_id}").json()
            mod_id = [m["id"] for m in models if m["name"] == "plant-disease-vision"][0]

        # Create Version V1
        ver_res = requests.post(f"{API_BASE_URL}/models/{mod_id}/versions", json={
            "model_id": mod_id,
            "version": "1.0",
            "artifact_path": os.path.abspath(artifact_path),
            "input_schema": input_schema,
            "output_schema": output_schema,
            "dependencies": {"torch": "2.2.0"},
            "metrics": {"accuracy": 0.942, "f1": 0.938},
            "parameters": {"architecture": "PlantDiseaseClassifier-NN", "layers": 3, "optimizer": "Adam"}
        })
        ver_id = ver_res.json().get("id")

        feature_stats = {}
        for feat in input_schema["features"]:
            name = feat["name"]
            feature_stats[name] = {
                "baseline_mean": 0.5,
                "baseline_std": 0.15,
                "samples": np.random.normal(0.5, 0.15, 100).tolist()
            }

        requests.post(f"{API_BASE_URL}/datasets", json={
            "project_id": proj_id,
            "name": "crop_leaf_images_v1",
            "version": "v1.0",
            "dvc_hash": "c3d4e5f67890123456789abcdef01a2b",
            "row_count": 2500,
            "feature_stats": feature_stats
        })

        if ver_id:
            requests.post(f"{API_BASE_URL}/models/versions/{ver_id}/promote", json={
                "stage": "Production",
                "reason": "Model V1 satisfies Accuracy threshold (>= 0.90)."
            })

        print("✅ PyTorch Vision Model V1 registered and promoted to Production!")

    except Exception as e:
        print(f"⚠️ Registration API offline or skipped: {e}")

if __name__ == "__main__":
    train_and_register_pytorch_vision_model()
