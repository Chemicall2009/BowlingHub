from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from datetime import datetime
import uuid

class Shot(SQLModel, table=True):
    __tablename__ = "shots"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    game_id: uuid.UUID = Field(foreign_key="games.id")
    player_id: uuid.UUID = Field(foreign_key="players.id")
    frame_number: int
    shot_number: int
    pins_down: int
    pins_state: list = Field(default_factory=list, sa_column=Column(JSON))
    is_foul: bool = False
    is_split: bool = False
    ball_speed: int | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
