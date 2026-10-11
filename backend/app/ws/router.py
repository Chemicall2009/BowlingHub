from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.ws.manager import manager
from app.config import settings
from app.services.event_bus import event_bus
from app.services.scoring import scoring_engine
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/events")
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or handle incoming messages if needed
            await websocket.send_json({"type": "ack", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@router.websocket("/ws/tv/{lane_id}")
async def websocket_tv_endpoint(websocket: WebSocket, lane_id: int):
    if not (1 <= lane_id <= settings.lanes_count):
        await websocket.close(code=4004, reason="Invalid lane ID")
        return

    await websocket.accept()
    logger.info(f"TV panel connected for lane {lane_id}")

    unsubscribe = None
    try:
        if settings.tv_snapshot_on_connect:
            scoreboard = await scoring_engine.get_active_scoreboard(lane_id)
            snapshot_event = {
                "type": "tv.snapshot",
                "lane_id": lane_id,
                "lane_display": f"{lane_id-1 if lane_id % 2 == 0 else lane_id}-{lane_id if lane_id % 2 == 0 else lane_id+1}",
                "current_game": scoreboard,
                "pins": [True]*10,
                "foul1": False,
                "foul2": False,
                "split": False,
                "speed_kmh": None,
                "baud": settings.serial_baud,
                "lane_status": "online"
            }
            await websocket.send_json(snapshot_event)

        async def event_callback(event: dict):
            if event.get("lane_id") == lane_id:
                try:
                    await websocket.send_json(event)
                except Exception:
                    pass

        unsubscribe = event_bus.subscribe(event_callback)

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                except Exception:
                    pass

    except WebSocketDisconnect:
        logger.info(f"TV panel disconnected for lane {lane_id}")
    except Exception as e:
        logger.error(f"TV WebSocket error for lane {lane_id}: {e}")
    finally:
        if unsubscribe:
            unsubscribe()

