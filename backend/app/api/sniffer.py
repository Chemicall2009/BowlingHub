from fastapi import APIRouter
from typing import List
from app.schemas.log import SnifferFrame

router = APIRouter(prefix="/api/sniffer", tags=["sniffer"])

@router.get("/frames", response_model=List[SnifferFrame])
def list_sniffer_frames():
    return [
        SnifferFrame(
            id="frame-1",
            timestamp="2026-10-11T00:00:00Z",
            direction="rx",
            raw_hex="01 02 03 04 05",
            parsed_command="POLL_STATUS",
            lane_id=1,
            status="OK",
            checksum_ok=True
        )
    ]
