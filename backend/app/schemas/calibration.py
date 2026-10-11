from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CalibrationProfileRead(BaseModel):
    id: str
    lane_id: int
    camera_id: Optional[str] = None
    camera_type: str
    roi: List[int]
    pin_coordinates: Dict[str, List[int]]
    threshold: int
    perspective_matrix: Optional[List[List[float]]] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class CalibrationProfileCreate(BaseModel):
    lane_id: int
    camera_id: Optional[str] = None
    camera_type: str
    roi: List[int]
    pin_coordinates: Dict[str, List[int]]
    threshold: int
    perspective_matrix: Optional[List[List[float]]] = None

class CalibrationProfileUpdate(BaseModel):
    camera_id: Optional[str] = None
    camera_type: Optional[str] = None
    roi: Optional[List[int]] = None
    pin_coordinates: Optional[Dict[str, List[int]]] = None
    threshold: Optional[int] = None
    perspective_matrix: Optional[List[List[float]]] = None
