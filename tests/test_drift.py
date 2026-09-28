import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

import numpy as np
from app.services.drift_engine import DriftEngine

def test_no_drift():
    np.random.seed(42)
    baseline = np.random.normal(50, 10, 200).tolist()
    production = np.random.normal(50, 10, 200).tolist()

    res = DriftEngine.detect_feature_drift("age", baseline, production)
    assert res["feature_name"] == "age"
    assert res["drift_detected"] is False

def test_drift_detected():
    np.random.seed(42)
    baseline = np.random.normal(50, 10, 200).tolist()
    production = np.random.normal(70, 10, 200).tolist()

    res = DriftEngine.detect_feature_drift("age", baseline, production)
    assert res["feature_name"] == "age"
    assert res["drift_detected"] is True
    assert res["drift_score"] > 0.1
