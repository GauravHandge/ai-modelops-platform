import os
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb
from typing import Any, Dict, List, Optional, Tuple
from model_adapters.base import ModelAdapter

class XGBoostAdapter(ModelAdapter):
    """
    Adapter for XGBoost classification & regression models (joblib/pickle, json, or binary model format).
    """

    def load(self) -> bool:
        if not os.path.exists(self.artifact_path):
            raise FileNotFoundError(f"XGBoost artifact not found at: {self.artifact_path}")
        
        try:
            self.model = joblib.load(self.artifact_path)
        except Exception:
            # Fallback to Booster loader if json/bin file
            bst = xgb.Booster()
            bst.load_model(self.artifact_path)
            self.model = bst

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

        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        elif isinstance(input_data, list):
            df = pd.DataFrame(input_data)
        elif isinstance(input_data, pd.DataFrame):
            df = input_data
        else:
            df = pd.DataFrame(input_data)

        expected_features = self.input_schema.get("features", [])
        if expected_features:
            feat_names = [f["name"] for f in expected_features if isinstance(f, dict) and "name" in f]
            if feat_names and all(col in df.columns for col in feat_names):
                df = df[feat_names]

        probabilities = None
        if isinstance(self.model, xgb.Booster):
            dmatrix = xgb.DMatrix(df)
            preds = self.model.predict(dmatrix)
            predictions = preds.tolist()
        elif hasattr(self.model, "predict_proba"):
            preds = self.model.predict(df)
            probs = self.model.predict_proba(df)
            predictions = preds.tolist() if isinstance(preds, np.ndarray) else list(preds)
            probabilities = probs.tolist() if isinstance(probs, np.ndarray) else list(probs)
        else:
            preds = self.model.predict(df)
            predictions = preds.tolist() if isinstance(preds, np.ndarray) else list(preds)

        final_pred = predictions[0] if len(predictions) == 1 and isinstance(input_data, dict) else predictions
        final_probs = probabilities[0] if probabilities and len(probabilities) == 1 and isinstance(input_data, dict) else probabilities

        return {
            "prediction": final_pred,
            "probabilities": final_probs
        }
