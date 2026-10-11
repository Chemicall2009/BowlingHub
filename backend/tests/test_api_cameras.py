/**
 * @file tests/test_api_cameras.py
 * @description Unit tests for cameras API endpoints.
 */

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_cameras():
    response = client.get("/api/cameras")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_camera_ping():
    response = client.post("/api/cameras/cam-1/ping")
    assert response.status_code in [200, 404]

def test_camera_snapshot_request():
    response = client.post("/api/cameras/cam-1/snapshot", json={"lane_id": 1})
    assert response.status_code in [202, 404]
