from pydantic import BaseModel
from typing import Optional, Dict, Any

class SettingsRead(BaseModel):
    transport: str
    serial_port: str
    serial_baud: int
    tcp_host: str
    tcp_port: int
    xor_mask_hex: str
    checksum_variant: str
    frame_length: int
    lanes_count: int
    lanes_start_number: int
    poll_interval_ms: int
    poll_timeout_ms: int
    inter_packet_delay_ms: int
    auto_baud_switch: bool
    mqtt_host: str
    mqtt_port: int
    mqtt_enabled: bool

class SettingsUpdate(BaseModel):
    transport: Optional[str] = None
    serial_port: Optional[str] = None
    serial_baud: Optional[int] = None
    tcp_host: Optional[str] = None
    tcp_port: Optional[int] = None
    xor_mask_hex: Optional[str] = None
    checksum_variant: Optional[str] = None
    frame_length: Optional[int] = None
    lanes_count: Optional[int] = None
    lanes_start_number: Optional[int] = None
    poll_interval_ms: Optional[int] = None
    poll_timeout_ms: Optional[int] = None
    inter_packet_delay_ms: Optional[int] = None
    auto_baud_switch: Optional[bool] = None
    mqtt_host: Optional[str] = None
    mqtt_port: Optional[int] = None
    mqtt_enabled: Optional[bool] = None
