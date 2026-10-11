from fastapi import APIRouter, Depends
from app.config import settings
from app.schemas.settings import SettingsRead, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=SettingsRead)
def get_settings():
    return SettingsRead(
        transport=settings.transport,
        serial_port=settings.serial_port,
        serial_baud=settings.serial_baud,
        tcp_host=settings.tcp_host,
        tcp_port=settings.tcp_port,
        xor_mask_hex=settings.xor_mask_hex,
        checksum_variant=settings.checksum_variant,
        frame_length=settings.frame_length,
        lanes_count=settings.lanes_count,
        lanes_start_number=settings.lanes_start_number,
        poll_interval_ms=settings.poll_interval_ms,
        poll_timeout_ms=settings.poll_timeout_ms,
        inter_packet_delay_ms=settings.inter_packet_delay_ms,
        auto_baud_switch=settings.auto_baud_switch,
        mqtt_host=settings.mqtt_host,
        mqtt_port=settings.mqtt_port,
        mqtt_enabled=settings.mqtt_enabled
    )

@router.put("", response_model=SettingsRead)
def update_settings(payload: SettingsUpdate):
    for key, value in payload.dict(exclude_unset=True).items():
        if hasattr(settings, key):
            setattr(settings, key, value)
    return get_settings()
