from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models.camera import CameraType, CameraMode, CameraStatus

class CameraRead(BaseModel):
    id: str
    name: str
    type: CameraType
    mode: CameraMode
    lane_ids: List[int]
    status: CameraStatus
    last_seen_at: Optional[datetime] = None
    last_status_payload: Optional[Dict[str, Any]] = None
    version: Optional[str] = None
    ip: Optional[str] = None
    wifi_rssi: Optional[int] = None
    uptime_sec: Optional[int] = None
    reset_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[CameraType] = None
    mode: Optional[CameraMode] = None
    lane_ids: Optional[List[int]] = None
    notes: Optional[str] = None

class SnapshotRequest(BaseModel):
    lane_id: Optional[int] = None

class SnapshotRead(BaseModel):
    id: str
    camera_id: str
    lane_id: int
    captured_at: datetime
    file_path: str
    file_size: int
    width: int
    height: int
    jpeg_quality: int
    triggered_by: str
    request_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CameraPingResponse(BaseModel):
    ok: bool
    latency_ms: float
    message: Optional[str] = None
