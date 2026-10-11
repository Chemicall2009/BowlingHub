"""
@file app/config.py
@description Pydantic settings for FastAPI backend.
"""

from typing import Literal
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    class Config:
        env_file = ".env"
        extra = "ignore"

    database_url: str = "sqlite:///./bowling.db"
    operation_mode: Literal["emulation", "combat"] = "emulation"

    # LCom
    transport: Literal["serial", "tcp", "mock"] = "mock"
    serial_port: str = "/dev/ttyUSB0"
    serial_baud: int = 9600
    tcp_host: str = "192.168.4.1"
    tcp_port: int = 2323
    xor_mask_hex: str = "00"
    checksum_variant: Literal["sum256", "xor"] = "sum256"
    frame_length: int = 30
    lanes_count: int = 12
    lanes_start_number: int = 1
    poll_interval_ms: int = 15
    poll_timeout_ms: int = 30
    inter_packet_delay_ms: int = 15
    auto_baud_switch: bool = True
    listen_only_enabled: bool = False
    tv_enabled: bool = True
    tv_snapshot_on_connect: bool = True
    tv_animation_seconds: int = 3
    speed_k: float = 18500.0

    # MQTT
    mqtt_host: str = "192.168.2.67"
    mqtt_port: int = 1883
    mqtt_user: str | None = None
    mqtt_pass: str | None = None
    mqtt_client_id: str = "bowling-backend"
    mqtt_enabled: bool = True

    # Snapshots
    static_dir: str = "./static"
    snapshots_dir: str = "./static/snapshots"
    snapshots_max_age_days: int = 30
    snapshots_max_per_camera: int = 1000

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://192.168.2.67:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

settings = Settings()
