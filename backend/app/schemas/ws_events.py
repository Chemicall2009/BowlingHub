/**
 * @file app/schemas/ws_events.py
 * @description Pydantic DTOs for WebSocket Server Events (discriminated union).
 */

from typing import Any, Dict, List, Optional, Literal, Union
from pydantic import BaseModel, Field

class BaseServerEvent(BaseModel):
    type: str
    timestamp: str

class LaneStatusChangedEvent(BaseServerEvent):
    type: Literal["lane.status_changed"] = "lane.status_changed"
    lane_id: int
    status: str
    scores: Optional[Dict[str, Any]] = None

class LanePinsChangedEvent(BaseServerEvent):
    type: Literal["lane.pins_changed"] = "lane.pins_changed"
    lane_id: int
    pins: List[bool]

class LaneOptionsChangedEvent(BaseServerEvent):
    type: Literal["lane.options_changed"] = "lane.options_changed"
    lane_id: int
    options: Dict[str, Any]

class LaneOfflineEvent(BaseServerEvent):
    type: Literal["lane.offline"] = "lane.offline"
    lane_id: int

class GameCreatedEvent(BaseServerEvent):
    type: Literal["game.created"] = "game.created"
    game_id: str
    lane_id: int
    players: List[Dict[str, Any]]

class GameShotRegisteredEvent(BaseServerEvent):
    type: Literal["game.shot_registered"] = "game.shot_registered"
    game_id: str
    lane_id: int
    shot: Dict[str, Any]

class GameFinishedEvent(BaseServerEvent):
    type: Literal["game.finished"] = "game.finished"
    game_id: str
    lane_id: int
    results: List[Dict[str, Any]]

class CameraStatusChangedEvent(BaseServerEvent):
    type: Literal["camera.status_changed"] = "camera.status_changed"
    camera_id: str
    status: str

class CameraSnapshotReadyEvent(BaseServerEvent):
    type: Literal["camera.snapshot_ready"] = "camera.snapshot_ready"
    camera_id: str
    lane_id: int
    snapshot_url: str
    request_id: str

class CameraOfflineEvent(BaseServerEvent):
    type: Literal["camera.offline"] = "camera.offline"
    camera_id: str

class CameraRequestResultEvent(BaseServerEvent):
    type: Literal["camera.request_result"] = "camera.request_result"
    camera_id: str
    request_id: str
    success: bool
    message: Optional[str] = None

class MqttConnectionEvent(BaseServerEvent):
    type: Literal["mqtt.connection"] = "mqtt.connection"
    connected: bool

class ModeChangedEvent(BaseServerEvent):
    type: Literal["mode.changed"] = "mode.changed"
    mode: str

class SnifferFrameEvent(BaseServerEvent):
    type: Literal["sniffer.frame"] = "sniffer.frame"
    raw_hex: str
    direction: str
    parsed: Optional[Dict[str, Any]] = None

class SnifferStatusEvent(BaseServerEvent):
    type: Literal["sniffer.status"] = "sniffer.status"
    active: bool

class EmulatorResponseEvent(BaseServerEvent):
    type: Literal["emulator.response"] = "emulator.response"
    command: str
    response_hex: str

class LogEntryEvent(BaseServerEvent):
    type: Literal["log.entry"] = "log.entry"
    level: str
    message: str
    source: str

class ConnectionStatusEvent(BaseServerEvent):
    type: Literal["connection.status"] = "connection.status"
    status: str

class ErrorEvent(BaseServerEvent):
    type: Literal["error"] = "error"
    code: int
    message: str

ServerEvent = Union[
    LaneStatusChangedEvent,
    LanePinsChangedEvent,
    LaneOptionsChangedEvent,
    LaneOfflineEvent,
    GameCreatedEvent,
    GameShotRegisteredEvent,
    GameFinishedEvent,
    CameraStatusChangedEvent,
    CameraSnapshotReadyEvent,
    CameraOfflineEvent,
    CameraRequestResultEvent,
    MqttConnectionEvent,
    ModeChangedEvent,
    SnifferFrameEvent,
    SnifferStatusEvent,
    EmulatorResponseEvent,
    LogEntryEvent,
    ConnectionStatusEvent,
    ErrorEvent
]
