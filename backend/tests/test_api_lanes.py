/**
 * @file tests/test_api_lanes.py
 * @description Unit tests for lanes API endpoints.
 */

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_lanes():
    response = client.get("/api/lanes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "lane_id" in data[0]

def test_get_lane():
    response = client.get("/api/lanes/1")
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert data["lane_id"] == 1
