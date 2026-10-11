from sqlmodel import SQLModel, Field
import uuid

class Player(SQLModel, table=True):
    __tablename__ = "players"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    game_id: uuid.UUID = Field(foreign_key="games.id")
    name: str
    order_index: int = 0
    final_score: int | None = None
