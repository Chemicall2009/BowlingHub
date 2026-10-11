from sqlmodel import SQLModel, Field
from datetime import datetime
import uuid

class Game(SQLModel, table=True):
    __tablename__ = "games"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    lane_id: int = Field(foreign_key="lanes.id")
    started_at: datetime = Field(default_factory=datetime.utcnow)
    finished_at: datetime | None = None
    status: str = "active"
    mode: str = "emulation"
