import os
import torch
import torch.nn as nn
import numpy as np
from typing import Any, Dict, List, Optional, Tuple
from model_adapters.base import ModelAdapter

class PyTorchAdapter(ModelAdapter):
    """
    Adapter for PyTorch computer vision & neural network models (TorchScript or PyTorch pickled model/state_dict).
    """

    def load(self) -> bool:
        if not os.path.exists(self.artifact_path):
            raise FileNotFoundError(f"PyTorch artifact not found at: {self.artifact_path}")

        try:
            # Try loading as TorchScript jit model
            self.model = torch.jit.load(self.artifact_path)
            self.model.eval()
        except Exception:
            # Fallback to torch.load for standard pickled model
            self.model = torch.load(self.artifact_path, map_location=torch.device("cpu"))
            if hasattr(self.model, "eval"):
                self.model.eval()

        self.loaded = True
        return True

    def validate_input(self, input_data: Any) -> Tuple[bool, Optional[str]]:
        if input_data is None:
            return False, "Input data cannot be null."
        
        # PyTorch model can accept a numerical tensor matrix, list of features, or preprocessed image array
        if not isinstance(input_data, (list, dict, np.ndarray)):
            return False, "PyTorch input data must be a list of feature values, structured dictionary, or tensor matrix."
        
        return True, None

    def predict(self, input_data: Any) -> Dict[str, Any]:
        if not self.loaded:
            self.load()

        # Convert input payload into torch Tensor
        if isinstance(input_data, dict):
            # Extract numerical feature values in sorted key order if list not passed
            values = [v for k, v in input_data.items() if isinstance(v, (int, float))]
            tensor_in = torch.tensor([values], dtype=torch.float32)
        elif isinstance(input_data, list):
            tensor_in = torch.tensor(input_data, dtype=torch.float32)
            if tensor_in.ndim == 1:
                tensor_in = tensor_in.unsqueeze(0)
        elif isinstance(input_data, np.ndarray):
            tensor_in = torch.from_numpy(input_data).float()
        else:
            tensor_in = torch.tensor(input_data, dtype=torch.float32)

        with torch.no_grad():
            outputs = self.model(tensor_in)

        # Convert outputs to list/probabilities
        if isinstance(outputs, torch.Tensor):
            if outputs.ndim > 1 and outputs.shape[1] > 1:
                probs = torch.softmax(outputs, dim=1).numpy().tolist()
                preds = torch.argmax(outputs, dim=1).numpy().tolist()
            else:
                probs = None
                preds = outputs.squeeze().numpy().tolist()
        else:
            preds = str(outputs)
            probs = None

        final_pred = preds[0] if isinstance(preds, list) and len(preds) == 1 and isinstance(input_data, dict) else preds
        final_probs = probs[0] if probs and len(probs) == 1 and isinstance(input_data, dict) else probs

        return {
            "prediction": final_pred,
            "probabilities": final_probs
        }
