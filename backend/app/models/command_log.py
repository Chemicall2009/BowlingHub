from sqlmodel import SQLModel, Field
from datetime import datetime
import uuid

class CommandLog(SQLModel, table=True):
    __tablename__ = "command_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    direction: str = "out"
    lane_id: int | None = None
    cmd: int | None = None
    cmd_name: str | None = None
    dry_run: bool = False
    raw_hex: str = ""
    response_hex: str | None = None
    checksum_ok: bool | None = None
    duration_ms: int = 0
    error: str | None = None
    source: str = "manual"
    data_mode: str = "emulation"
