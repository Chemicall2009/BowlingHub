from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from uuid import uuid4
from app.db import get_session
from app.models.calibration import CalibrationProfile
from app.schemas.calibration import CalibrationProfileRead, CalibrationProfileCreate, CalibrationProfileUpdate
from app.services.calibration import calibration_service

router = APIRouter(prefix="/api/calibration", tags=["calibration"])

@router.get("/profiles", response_model=List[CalibrationProfileRead])
def list_calibration_profiles(lane_id: Optional[int] = Query(None), session: Session = Depends(get_session)):
    query = select(CalibrationProfile)
    if lane_id is not None:
        query = query.where(CalibrationProfile.lane_id == lane_id)
    profiles = session.exec(query).all()
    if not profiles and lane_id:
        # Create default profile if none exists
        prof = CalibrationProfile(
            id=str(uuid4()),
            lane_id=lane_id,
            camera_id=f"cam-lane-{lane_id}",
            camera_type="tvision",
            roi=[0, 0, 640, 480],
            pin_coordinates={"1": [320, 100], "2": [300, 130], "3": [340, 130], "4": [280, 160], "5": [320, 160], "6": [360, 160], "7": [260, 190], "8": [300, 190], "9": [340, 190], "10": [380, 190]},
            threshold=128,
            created_at="2026-10-11T00:00:00Z",
            updated_at="2026-10-11T00:00:00Z"
        )
        session.add(prof)
        session.commit()
        profiles = [prof]
    return profiles

@router.get("/profiles/{id}", response_model=CalibrationProfileRead)
def get_calibration_profile(id: str, session: Session = Depends(get_session)):
    profile = session.get(CalibrationProfile, id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Calibration profile {id} not found")
    return profile

@router.post("/profiles", response_model=CalibrationProfileRead)
def create_calibration_profile(payload: CalibrationProfileCreate, session: Session = Depends(get_session)):
    profile = CalibrationProfile(
        id=str(uuid4()),
        lane_id=payload.lane_id,
        camera_id=payload.camera_id or f"cam-lane-{payload.lane_id}",
        camera_type=payload.camera_type,
        roi=payload.roi,
        pin_coordinates=payload.pin_coordinates,
        threshold=payload.threshold,
        perspective_matrix=payload.perspective_matrix,
        created_at="2026-10-11T00:00:00Z",
        updated_at="2026-10-11T00:00:00Z"
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

@router.put("/profiles/{id}", response_model=CalibrationProfileRead)
def update_calibration_profile(id: str, payload: CalibrationProfileUpdate, session: Session = Depends(get_session)):
    profile = session.get(CalibrationProfile, id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Calibration profile {id} not found")
    
    update_data = payload.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(profile, key, val)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

@router.delete("/profiles/{id}")
def delete_calibration_profile(id: str, session: Session = Depends(get_session)):
    profile = session.get(CalibrationProfile, id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Calibration profile {id} not found")
    session.delete(profile)
    session.commit()
    return {"ok": True}

@router.post("/profiles/{id}/test-run")
async def test_run_calibration(id: str, session: Session = Depends(get_session)):
    profile = session.get(CalibrationProfile, id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Calibration profile {id} not found")
    return await calibration_service.test_run_profile(id)
