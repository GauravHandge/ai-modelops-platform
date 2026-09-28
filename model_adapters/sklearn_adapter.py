import os
import joblib
import pandas as pd
import numpy as np
from typing import Any, Dict, List, Optional, Tuple
from model_adapters.base import ModelAdapter

class SklearnAdapter(ModelAdapter):
    """
    Adapter for Scikit-Learn classification & regression models stored as joblib/pickle files.
    """

    def load(self) -> bool:
        if not os.path.exists(self.artifact_path):
            raise FileNotFoundError(f"Model artifact not found at: {self.artifact_path}")
        self.model = joblib.load(self.artifact_path)
        self.loaded = True
        return True

    def validate_input(self, input_data: Any) -> Tuple[bool, Optional[str]]:
        if not self.input_schema:
            return True, None
        
        expected_features = self.input_schema.get("features", [])
        if not expected_features:
            return True, None

        if isinstance(input_data, dict):
            payloads = [input_data]
        elif isinstance(input_data, list):
            payloads = input_data
        else:
            return False, "Input data must be a JSON object (dict) or array of JSON objects (list)."

        expected_names = [f["name"] for f in expected_features if isinstance(f, dict) and "name" in f]
        
        for idx, row in enumerate(payloads):
            if not isinstance(row, dict):
                return False, f"Item at index {idx} is not a valid dictionary."
            missing = [feat for feat in expected_names if feat not in row]
            if missing:
                return False, f"Item at index {idx} missing required features: {missing}"
        
        return True, None

    def predict(self, input_data: Any) -> Dict[str, Any]:
        if not self.loaded:
            self.load()

        # Format input_data to pandas DataFrame
        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        elif isinstance(input_data, list):
            df = pd.DataFrame(input_data)
        elif isinstance(input_data, pd.DataFrame):
            df = input_data
        else:
            df = pd.DataFrame(input_data)

        # Align columns if input_schema features are specified
        expected_features = self.input_schema.get("features", [])
        if expected_features:
            feat_names = [f["name"] for f in expected_features if isinstance(f, dict) and "name" in f]
            if feat_names and all(col in df.columns for col in feat_names):
                df = df[feat_names]

        predictions = self.model.predict(df)
        
        probabilities = None
        if hasattr(self.model, "predict_proba"):
            try:
                probs = self.model.predict_proba(df)
                probabilities = probs.tolist()
            except Exception:
                probabilities = None

        pred_list = predictions.tolist() if isinstance(predictions, np.ndarray) else list(predictions)
        
        # If single item request, unwrap list for clean single prediction response
        final_prediction = pred_list[0] if len(pred_list) == 1 and isinstance(input_data, dict) else pred_list
        final_probs = probabilities[0] if probabilities and len(probabilities) == 1 and isinstance(input_data, dict) else probabilities

        return {
            "prediction": final_prediction,
            "probabilities": final_probs
        }
