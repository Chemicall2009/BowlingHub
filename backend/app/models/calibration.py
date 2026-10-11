from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from datetime import datetime
import uuid

class CalibrationProfile(SQLModel, table=True):
    __tablename__ = "calibration_profiles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    camera_id: str
    lane_id: int
    camera_type: str = "pin_deck"
    polygon_roi: list = Field(default_factory=list, sa_column=Column(JSON))
    pin_positions: list = Field(default_factory=list, sa_column=Column(JSON))
    reference_frame_url: str = ""
    is_active: bool = True
    notes: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    data_mode: str = "emulation"
