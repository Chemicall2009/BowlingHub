from sqlmodel import SQLModel, Field
from datetime import datetime
import uuid

class MqttLog(SQLModel, table=True):
    __tablename__ = "mqtt_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    topic: str
    direction: str = "in"
    payload_preview: str = ""
    payload_size: int = 0
    qos: int = 0
    retained: bool = False
    camera_id: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
