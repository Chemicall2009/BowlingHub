from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class LaneOptionsSchema(BaseModel):
    bambini: bool = False
    cosmic: bool = False
    kbd_lock: bool = False
    no_speed: bool = False
    swap_off: bool = False

class CurrentGameSchema(BaseModel):
    id: str
    player_name: str
    score: int
    frame: int

class ShotSchema(BaseModel):
    id: str
    frame: int
    shot: int
    pins_down: int
    pins_state: List[bool]
    is_foul: bool
    is_split: bool
    ball_speed: Optional[float] = None
    timestamp: str

class LaneRead(BaseModel):
    id: int
    number: int
    name: Optional[str] = None
    status: str
    is_active: bool
    last_seen_at: str
    options: LaneOptionsSchema
    pins: List[bool]
    foul1: bool
    foul2: bool
    split: bool
    speed: Optional[float] = None
    current_game: Optional[CurrentGameSchema] = None
    shots: List[ShotSchema] = []

    class Config:
        from_attributes = True

class PinsUpdateSchema(BaseModel):
    pins: List[bool]

class ShotAddSchema(BaseModel):
    frame: int
    shot: int
    pins_down: int
    pins_state: List[bool]
    is_foul: Optional[bool] = False
    is_split: Optional[bool] = False
    ball_speed: Optional[float] = None
