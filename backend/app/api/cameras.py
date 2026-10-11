from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from app.db import get_session
from app.models.camera import Camera, CameraStatus, CameraType, CameraMode
from app.models.snapshot import Snapshot
from app.schemas.camera import CameraRead, CameraUpdate, SnapshotRead, CameraPingResponse
from app.services.camera_service import CameraService
from app.mqtt.client import mqtt_client
from app.mqtt.topics import cmd_topic

router = APIRouter(prefix="/api/cameras", tags=["cameras"])
camera_service = CameraService(mqtt_client)

@router.get("", response_model=List[CameraRead])
def list_cameras(session: Session = Depends(get_session)):
    cameras = session.exec(select(Camera)).all()
    if not cameras:
        # Seed default mock cameras if none exist
        default_cams = [
            Camera(id="cam-lane-1", name="Camera Lane 1-2", type=CameraType.TVISION, mode=CameraMode.DUAL_LANE, lane_ids=[1, 2], status=CameraStatus.ONLINE, ip="192.168.2.101"),
            Camera(id="cam-lane-3", name="Camera Lane 3-4", type=CameraType.TVISION, mode=CameraMode.DUAL_LANE, lane_ids=[3, 4], status=CameraStatus.ONLINE, ip="192.168.2.102"),
        ]
        for c in default_cams:
            session.add(c)
        session.commit()
        cameras = session.exec(select(Camera)).all()
    return cameras

@router.get("/{camera_id}", response_model=CameraRead)
def get_camera(camera_id: str, session: Session = Depends(get_session)):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    return camera

@router.patch("/{camera_id}", response_model=CameraRead)
def update_camera(camera_id: str, payload: CameraUpdate, session: Session = Depends(get_session)):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(camera, key, value)
    camera.updated_at = datetime.utcnow()
    session.add(camera)
    session.commit()
    session.refresh(camera)
    return camera

@router.post("/{camera_id}/snapshot")
async def request_camera_snapshot(camera_id: str, session: Session = Depends(get_session)):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    
    lane_id = camera.lane_ids[0] if camera.lane_ids else 1
    request_id = await camera_service.request_snapshot(camera_id, lane_id)
    return {"lane_id": lane_id, "request_id": request_id, "status": "pending"}

@router.get("/{camera_id}/snapshots", response_model=List[SnapshotRead])
def list_snapshots(camera_id: str, limit: int = 20, offset: int = 0, lane_id: Optional[int] = None, session: Session = Depends(get_session)):
    query = select(Snapshot).where(Snapshot.camera_id == camera_id)
    if lane_id is not None:
        query = query.where(Snapshot.lane_id == lane_id)
    query = query.order_by(Snapshot.captured_at.desc()).offset(offset).limit(limit)
    snapshots = session.exec(query).all()
    return snapshots

@router.get("/{camera_id}/latest", response_model=SnapshotRead)
def get_latest_snapshot(camera_id: str, session: Session = Depends(get_session)):
    snapshot = session.exec(select(Snapshot).where(Snapshot.camera_id == camera_id).order_by(Snapshot.captured_at.desc())).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="No snapshots found for this camera")
    return snapshot

@router.post("/{camera_id}/ping", response_model=CameraPingResponse)
async def ping_camera(camera_id: str, session: Session = Depends(get_session)):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    # Simulate ping over MQTT or network
    return {"ok": True, "latency_ms": 12.5, "message": "Camera responded"}

@router.post("/{camera_id}/reboot")
async def reboot_camera(camera_id: str, session: Session = Depends(get_session)):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    mqtt_client.publish(cmd_topic(camera_id), {"action": "reboot"})
    return {"ok": True}

@router.get("/for-lane/{lane_id}", response_model=Optional[CameraRead])
def get_camera_for_lane(lane_id: int, session: Session = Depends(get_session)):
    cameras = session.exec(select(Camera)).all()
    for cam in cameras:
        if lane_id in cam.lane_ids:
            return cam
    return None
