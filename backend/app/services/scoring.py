import logging
from sqlmodel import select
from app.db import engine, Session
from app.models.game import Game
from app.models.player import Player
from app.models.shot import Shot
from app.services.event_bus import event_bus
from datetime import datetime

logger = logging.getLogger(__name__)

def ticks_to_kmh(ticks: int | None, k: float = 18500.0) -> float | None:
    if not ticks or ticks == 0:
        return None
    return round(k / ticks, 1)

class ScoringEngine:
    @staticmethod
    def calculate_game_score(rolls: list[int]) -> int:
        """
        Calculate total bowling score from a list of roll pin counts.
        """
        score = 0
        roll_idx = 0
        for frame in range(10):
            if roll_idx >= len(rolls):
                break
            # Strike
            if rolls[roll_idx] == 10:
                score += 10 + (rolls[roll_idx + 1] if roll_idx + 1 < len(rolls) else 0) + (rolls[roll_idx + 2] if roll_idx + 2 < len(rolls) else 0)
                roll_idx += 1
            # Spare
            elif roll_idx + 1 < len(rolls) and rolls[roll_idx] + rolls[roll_idx + 1] == 10:
                score += 10 + (rolls[roll_idx + 2] if roll_idx + 2 < len(rolls) else 0)
                roll_idx += 2
            else:
                score += (rolls[roll_idx] if roll_idx < len(rolls) else 0) + (rolls[roll_idx + 1] if roll_idx + 1 < len(rolls) else 0)
                roll_idx += 2
        return score

    @staticmethod
    async def observe_shot(lane_id: int, pins_down: int, foul: bool = False, split: bool = False, speed_ticks: int | None = None, speed_k: float = 18500.0, timestamp: datetime | None = None):
        with Session(engine) as session:
            game = session.exec(select(Game).where(Game.lane_id == lane_id, Game.status == "active")).first()
            if not game:
                return None
            
            player = session.exec(select(Player).where(Player.game_id == game.id).order_by(Player.order_index)).first()
            if not player:
                return None

            shots = session.exec(select(Shot).where(Shot.game_id == game.id, Shot.player_id == player.id)).all()
            frame_number = 1
            shot_number = 1
            if shots:
                last_shot = shots[-1]
                frame_number = last_shot.frame_number
                shot_number = last_shot.shot_number + 1
                if shot_number > 2 or (shot_number == 2 and last_shot.pins_down == 10 and frame_number < 10):
                    frame_number += 1
                    shot_number = 1
                if frame_number > 10:
                    frame_number = 10
                    shot_number = min(3, shot_number)

            speed_kmh = ticks_to_kmh(speed_ticks, speed_k)
            shot = Shot(
                game_id=game.id,
                player_id=player.id,
                frame_number=frame_number,
                shot_number=shot_number,
                pins_down=pins_down,
                is_foul=foul,
                is_split=split,
                ball_speed=speed_kmh,
                timestamp=timestamp or datetime.utcnow()
            )
            session.add(shot)
            session.commit()
            session.refresh(shot)

            all_player_shots = session.exec(select(Shot).where(Shot.game_id == game.id, Shot.player_id == player.id)).all()
            rolls = [s.pins_down for s in all_player_shots]
            score = ScoringEngine.calculate_game_score(rolls)
            player.final_score = score
            session.add(player)
            session.commit()

            event_data = {
                "type": "game.shot_registered",
                "lane_id": lane_id,
                "player_name": player.name,
                "pins_down": pins_down,
                "shot_number": shot_number,
                "frame_number": frame_number,
                "is_strike": pins_down == 10 and shot_number == 1,
                "is_spare": shot_number == 2 and sum(rolls[-2:]) == 10,
                "score_after": score,
                "timestamp": (timestamp or datetime.utcnow()).isoformat()
            }
            await event_bus.publish(event_data)
            await event_bus.publish({
                "type": "tv.shot_registered",
                **event_data
            })
            return shot

    @staticmethod
    async def get_active_scoreboard(lane_id: int):
        with Session(engine) as session:
            game = session.exec(select(Game).where(Game.lane_id == lane_id, Game.status == "active")).first()
            if not game:
                return None
            players = session.exec(select(Player).where(Player.game_id == game.id).order_by(Player.order_index)).all()
            players_data = []
            for p in players:
                shots = session.exec(select(Shot).where(Shot.game_id == game.id, Shot.player_id == p.id)).all()
                rolls = [s.pins_down for s in shots]
                score = ScoringEngine.calculate_game_score(rolls)
                players_data.append({
                    "player_id": str(p.id),
                    "player_name": p.name,
                    "score": score,
                    "rolls": rolls
                })
            return {
                "game_id": str(game.id),
                "lane_id": lane_id,
                "status": game.status,
                "players": players_data
            }

scoring_engine = ScoringEngine()

