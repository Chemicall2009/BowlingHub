/**
 * @file tests/test_ws_events.py
 * @description Unit tests for WebSocket events and manager.
 */

import pytest
from app.ws.manager import ConnectionManager
from app.schemas.ws_events import LaneStatusChangedEvent

@pytest.mark.asyncio
async def test_ws_manager():
    manager = ConnectionManager()
    assert manager.active_connections_count == 0

def test_ws_event_serialization():
    event = LaneStatusChangedEvent(lane_id=1, status="ready", timestamp="2026-10-11T00:00:00Z")
    data = event.model_dump()
    assert data["type"] == "lane.status_changed"
    assert data["lane_id"] == 1
    assert data["status"] == "ready"
