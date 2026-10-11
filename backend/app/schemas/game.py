from pydantic import BaseModel
from typing import Optional, List, Any

class GameCreate(BaseModel):
    lane_id: int
    player_names: List[str]

class FrameScore(BaseModel):
    frame: int
    rolls: List[int]
    score: int
    is_strike: bool
    is_spare: bool

class PlayerScore(BaseModel):
    player_id: str
    player_name: str
    frames: List[FrameScore]
    total_score: int

class ScoreboardRead(BaseModel):
    game_id: str
    lane_id: int
    status: str
    current_frame: int
    current_player_index: int
    players: List[PlayerScore]

class GameRead(BaseModel):
    id: str
    lane_id: int
    status: str
    players: List[Dict[str, Any]]
    created_at: str
    ended_at: Optional[str] = None
