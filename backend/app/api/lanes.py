from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models.lane import Lane
from app.schemas.lane import LaneRead, PinsUpdateSchema, ShotAddSchema
from app.lcom.pins import PinState

router = APIRouter(tags=["lanes"])

def get_or_create_lanes(session: Session) -> List[Lane]:
    lanes = session.exec(select(Lane).order_by(Lane.id)).all()
    if not lanes:
        for i in range(1, 13):
            lane = Lane(
                id=i,
                number=i,
                name=f"Дорожка {i}",
                status="online",
                is_active=False,
                last_seen_at="2026-10-11T00:00:00Z",
                options={"bambini": False, "cosmic": False, "kbd_lock": False, "no_speed": False, "swap_off": False},
                pins=[True]*10,
                foul1=False,
                foul2=False,
                split=False,
                speed=None,
                current_game=None,
                shots=[]
            )
            session.add(lane)
        session.commit()
        lanes = session.exec(select(Lane).order_by(Lane.id)).all()
    return lanes

@router.get("/api/lanes", response_model=List[LaneRead])
@router.get("/lanes", response_model=List[LaneRead])
def list_lanes(session: Session = Depends(get_session)):
    return get_or_create_lanes(session)

@router.get("/api/lanes/{id}", response_model=LaneRead)
@router.get("/lanes/{id}", response_model=LaneRead)
def get_lane(id: int, session: Session = Depends(get_session)):
    lane = session.get(Lane, id)
    if not lane:
        raise HTTPException(status_code=404, detail=f"Lane {id} not found")
    return lane

@router.post("/api/lanes/{id}/reset", response_model=LaneRead)
@router.post("/lanes/{id}/reset", response_model=LaneRead)
def reset_lane(id: int, session: Session = Depends(get_session)):
    lane = session.get(Lane, id)
    if not lane:
        raise HTTPException(status_code=404, detail=f"Lane {id} not found")
    lane.pins = [True]*10
    lane.foul1 = False
    lane.foul2 = False
    lane.split = False
    session.add(lane)
    session.commit()
    session.refresh(lane)
    return lane

@router.post("/api/lanes/{id}/options", response_model=LaneRead)
@router.post("/lanes/{id}/options", response_model=LaneRead)
def update_lane_options(id: int, payload: dict, session: Session = Depends(get_session)):
    lane = session.get(Lane, id)
    if not lane:
        raise HTTPException(status_code=404, detail=f"Lane {id} not found")
    lane.options = {**lane.options, **payload}
    session.add(lane)
    session.commit()
    session.refresh(lane)
    return lane

@router.post("/api/lanes/{id}/pins", response_model=LaneRead)
@router.post("/lanes/{id}/pins", response_model=LaneRead)
def update_lane_pins(id: int, payload: PinsUpdateSchema, session: Session = Depends(get_session)):
    lane = session.get(Lane, id)
    if not lane:
        raise HTTPException(status_code=404, detail=f"Lane {id} not found")
    lane.pins = payload.pins
    session.add(lane)
    session.commit()
    session.refresh(lane)
    return lane

@router.post("/api/lanes/{id}/shots", response_model=LaneRead)
@router.post("/lanes/{id}/shots", response_model=LaneRead)
def add_lane_shot(id: int, payload: ShotAddSchema, session: Session = Depends(get_session)):
    lane = session.get(Lane, id)
    if not lane:
        raise HTTPException(status_code=404, detail=f"Lane {id} not found")
    shot_dict = payload.dict()
    shot_dict["id"] = f"shot-{len(lane.shots)+1}"
    shot_dict["timestamp"] = "2026-10-11T00:00:00Z"
    lane.shots.append(shot_dict)
    session.add(lane)
    session.commit()
    session.refresh(lane)
    return lane

@router.post("/api/lanes/{id}/poll", response_model=dict)
@router.post("/lanes/{id}/poll", response_model=dict)
def poll_lane(id: int, session: Session = Depends(get_session)):
    lane = session.get(Lane, id)
    if not lane:
        raise HTTPException(status_code=404, detail=f"Lane {id} not found")
    return {"pins": lane.pins, "foul1": lane.foul1, "foul2": lane.foul2, "split": lane.split}
