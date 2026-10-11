from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from datetime import datetime

class SettingsModel(SQLModel, table=True):
    __tablename__ = "settings"

    id: int = Field(primary_key=True, default=1)
    transport: str = "mock"
    serial_port: str | None = "/dev/ttyUSB0"
    serial_baud: int = 9600
    tcp_host: str | None = "192.168.4.1"
    tcp_port: int | None = 2323
    xor_mask_hex: str = "00"
    checksum_variant: str = "sum256"
    frame_length: int = 30
    lanes_count: int = 12
    lanes_start_number: int = 1
    poll_interval_ms: int = 15
    poll_timeout_ms: int = 30
    inter_packet_delay_ms: int = 15
    auto_baud_switch: bool = True
    mqtt_host: str = "192.168.2.67"
    mqtt_port: int = 1883
    mqtt_user: str | None = None
    mqtt_pass: str | None = None
    mqtt_client_id: str = "bowling-backend"
    mqtt_enabled: bool = True
    operation_mode: str = "emulation"
    last_mode_switch_at: datetime | None = None
    last_mode_switch_by: str | None = None
    notifications: list = Field(default_factory=list, sa_column=Column(JSON))
