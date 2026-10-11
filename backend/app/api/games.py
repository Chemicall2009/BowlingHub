from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models.game import Game
from app.schemas.game import GameCreate, GameRead, ScoreboardRead

router = APIRouter(prefix="/api/games", tags=["games"])

@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: str, session: Session = Depends(get_session)):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")
    return game

@router.get("/{game_id}/scoreboard", response_model=ScoreboardRead)
def get_scoreboard(game_id: str, session: Session = Depends(get_session)):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")
    return {
        "game_id": game.id,
        "lane_id": game.lane_id,
        "status": game.status,
        "current_frame": 1,
        "current_player_index": 0,
        "players": []
    }

@router.post("", response_model=GameRead)
def create_game(payload: GameCreate, session: Session = Depends(get_session)):
    game = Game(
        id=f"game-{100 + len(session.exec(select(Game)).all())}",
        lane_id=payload.lane_id,
        status="active",
        players=[{"player_id": f"p-{i}", "player_name": name} for i, name in enumerate(payload.player_names)],
        created_at="2026-10-11T00:00:00Z"
    )
    session.add(game)
    session.commit()
    session.refresh(game)
    return game

@router.delete("/{game_id}")
def delete_game(game_id: str, session: Session = Depends(get_session)):
    game = session.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")
    session.delete(game)
    session.commit()
    return {"ok": True}
