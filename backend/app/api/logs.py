from fastapi import APIRouter
from typing import List
from app.schemas.log import LogEntry

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.get("", response_model=List[LogEntry])
def list_logs():
    return [
        LogEntry(
            id="log-1",
            timestamp="2026-10-11T00:00:00Z",
            level="info",
            category="system",
            message="System initialized successfully",
            details={"version": "1.0.0"}
        )
    ]
