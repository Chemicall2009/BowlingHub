from sqlmodel import SQLModel, Field
from datetime import datetime

class Lane(SQLModel, table=True):
    __tablename__ = "lanes"

    id: int = Field(primary_key=True)
    number: int
    name: str | None = None
    is_active: bool = False
    last_seen_at: datetime | None = None
    mode: str = "emulation"
