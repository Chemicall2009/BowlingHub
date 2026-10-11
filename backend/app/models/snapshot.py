from sqlmodel import SQLModel, Field
from datetime import datetime
import uuid

class Snapshot(SQLModel, table=True):
    __tablename__ = "snapshots"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    camera_id: str = Field(foreign_key="cameras.id")
    lane_id: int
    captured_at: datetime = Field(default_factory=datetime.utcnow)
    file_path: str
    file_size: int
    width: int
    height: int
    jpeg_quality: int
    triggered_by: str = "manual"
    request_id: str | None = None
    data_mode: str = "emulation"
    created_at: datetime = Field(default_factory=datetime.utcnow)
