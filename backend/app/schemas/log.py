from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class LogEntry(BaseModel):
    id: str
    timestamp: str
    level: str
    category: str
    message: str
    details: Optional[Dict[str, Any]] = None

class SnifferFrame(BaseModel):
    id: str
    timestamp: str
    direction: str # "rx" | "tx"
    raw_hex: str
    parsed_command: Optional[str] = None
    lane_id: Optional[int] = None
    status: str
    checksum_ok: bool
