import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

import numpy as np
import pandas as pd
import joblib
import torch
import torch.nn as nn
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb

from model_adapters.sklearn_adapter import SklearnAdapter
from model_adapters.xgboost_adapter import XGBoostAdapter
from model_adapters.pytorch_adapter import PyTorchAdapter
from model_adapters.factory import get_model_adapter

TEMP_DIR = "./storage/test_artifacts"
os.makedirs(TEMP_DIR, exist_ok=True)

def test_sklearn_adapter():
    X = np.array([[1, 2], [3, 4], [5, 6], [7, 8]])
    y = np.array([0, 0, 1, 1])
    clf = RandomForestClassifier(n_estimators=5, random_state=42)
    clf.fit(X, y)

    path = os.path.join(TEMP_DIR, "sklearn_dummy.joblib")
    joblib.dump(clf, path)

    adapter = SklearnAdapter(artifact_path=path)
    adapter.load()

    res = adapter.predict({"f1": 3, "f2": 4})
    assert "prediction" in res
    assert res["prediction"] in [0, 1]

def test_xgboost_adapter():
    X = np.array([[10, 20], [30, 40], [50, 60], [70, 80]])
    y = np.array([100.0, 200.0, 300.0, 400.0])
    reg = xgb.XGBRegressor(n_estimators=5, random_state=42)
    reg.fit(X, y)

    path = os.path.join(TEMP_DIR, "xgb_dummy.joblib")
    joblib.dump(reg, path)

    adapter = XGBoostAdapter(artifact_path=path)
    adapter.load()

    res = adapter.predict({"f1": 25, "f2": 35})
    assert "prediction" in res
    assert isinstance(res["prediction"], (int, float))

def test_pytorch_adapter():
    class DummyNN(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc = nn.Linear(4, 2)
        def forward(self, x):
            return self.fc(x)

    model = DummyNN()
    scripted = torch.jit.script(model)
    path = os.path.join(TEMP_DIR, "pytorch_dummy.pt")
    scripted.save(path)

    adapter = PyTorchAdapter(artifact_path=path)
    adapter.load()

    res = adapter.predict([1.0, 2.0, 3.0, 4.0])
    assert "prediction" in res

def test_factory():
    adapter = get_model_adapter("Scikit-learn", artifact_path="./dummy.joblib")
    assert isinstance(adapter, SklearnAdapter)

    adapter_xgb = get_model_adapter("XGBoost", artifact_path="./dummy.joblib")
    assert isinstance(adapter_xgb, XGBoostAdapter)
