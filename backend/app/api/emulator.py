from fastapi import APIRouter

router = APIRouter(prefix="/api/emulator", tags=["emulator"])

@router.get("/status")
def get_emulator_status():
    return {"running": True, "connected_lanes": 12, "mode": "mock"}
