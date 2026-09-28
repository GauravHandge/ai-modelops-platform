from typing import Any, Dict, Optional
from model_adapters.base import ModelAdapter
from model_adapters.sklearn_adapter import SklearnAdapter
from model_adapters.xgboost_adapter import XGBoostAdapter
from model_adapters.pytorch_adapter import PyTorchAdapter

def get_model_adapter(
    framework: str,
    artifact_path: str,
    input_schema: Optional[Dict[str, Any]] = None,
    output_schema: Optional[Dict[str, Any]] = None
) -> ModelAdapter:
    """
    Factory function to instantiate the correct ModelAdapter for a model artifact.
    """
    fw_lower = framework.lower()
    
    if "sklearn" in fw_lower or "scikit" in fw_lower:
        return SklearnAdapter(artifact_path, input_schema, output_schema)
    elif "xgboost" in fw_lower or "xgb" in fw_lower:
        return XGBoostAdapter(artifact_path, input_schema, output_schema)
    elif "torch" in fw_lower or "pytorch" in fw_lower:
        return PyTorchAdapter(artifact_path, input_schema, output_schema)
    else:
        # Default to SklearnAdapter for generic Python pickled objects
        return SklearnAdapter(artifact_path, input_schema, output_schema)
