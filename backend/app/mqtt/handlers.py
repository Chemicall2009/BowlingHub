import json
import structlog
from app.models.camera import Camera
from app.models.snapshot import Snapshot
from app.models.mqtt_log import MqttLog
from app.db import engine
from sqlmodel import Session

logger = structlog.get_logger()

async def handle_status(camera_id, payload):
    data = json.loads(payload)
    with Session(engine) as session:
        camera = session.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            camera = Camera(id=camera_id, name=f"Cam {camera_id}", type="tvision")
            session.add(camera)
        camera.status = "online"
        # Update other fields...
        session.commit()
    logger.info("Camera status updated", camera_id=camera_id)

async def handle_snapshot(camera_id, payload):
    # Save snapshot logic
    pass

async def handle_result(camera_id, payload):
    pass

async def handle_events(camera_id, payload):
    pass
