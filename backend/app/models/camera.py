from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from datetime import datetime

class Camera(SQLModel, table=True):
    __tablename__ = "cameras"

    id: str = Field(primary_key=True)
    name: str
    type: str = "pin_deck"
    mode: str = "single_lane"
    lane_ids: list = Field(default_factory=list, sa_column=Column(JSON))
    status: str = "offline"
    last_seen_at: datetime | None = None
    last_status_payload: dict | None = Field(default=None, sa_column=Column(JSON))
    version: str | None = None
    ip: str | None = None
    wifi_rssi: int | None = None
    uptime_sec: int | None = None
    reset_reason: str | None = None
    notes: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    data_mode: str = "emulation"
