import os
import sys
import uuid
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def get_auth_token():
    uid = uuid.uuid4().hex[:6]
    email = f"testuser_{uid}@modelops.io"
    password = "SecurePassword123!"

    payload = {
        "email": email,
        "username": f"user_{uid}",
        "password": password,
        "full_name": "Test User Suite",
        "organization_name": f"Org_{uid}"
    }
    reg_res = client.post("/api/auth/register", json=payload)
    if reg_res.status_code == 200:
        return reg_res.json()["access_token"]
    return None

def test_auth_registration():
    uid = uuid.uuid4().hex[:6]
    payload = {
        "email": f"test_reg_{uid}@modelops.io",
        "username": f"user_reg_{uid}",
        "password": "SecurePassword123!",
        "full_name": "Test Reg User",
        "organization_name": "Test Org"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_project_crud():
    token = get_auth_token()
    assert token is not None
    headers = {"Authorization": f"Bearer {token}"}

    uid = uuid.uuid4().hex[:6]
    response = client.post("/api/projects", json={
        "name": f"Integration Test Project {uid}",
        "description": "Created during automated API test suite."
    }, headers=headers)
    assert response.status_code in [200, 201]

    list_res = client.get("/api/projects", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) > 0

def test_dashboard_summary():
    token = get_auth_token()
    assert token is not None
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/monitoring/dashboard-summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_projects" in data
    assert "registered_models" in data
