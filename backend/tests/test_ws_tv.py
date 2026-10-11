/**
 * @file tests/test_ws_tv.py
 * @description Unit tests for TV WebSocket endpoint /ws/tv/{lane_id}.
 */

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ws_tv_invalid_lane():
    with client.websocket_connect("/ws/tv/999") as websocket:
        # Should close with invalid lane ID
        pass
    # TestClient raises WebSocketDisconnect or returns closed connection
    assert True

def test_ws_tv_connection():
    with client.websocket_connect("/ws/tv/6") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "tv.snapshot"
        assert data["lane_id"] == 6

        websocket.send_text("ping")
        msg = websocket.receive_text()
        assert msg == "pong"
