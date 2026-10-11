# Bowling Club Management System - Backend

FastAPI backend bridging the React frontend, ESP32-CAM MQTT cameras, and LCom RS-485 bowling equipment bus (Qubica AMF reverse-engineered).

## Features
- **Emulation & Combat Modes**: Switch dynamically between virtual mock environment and real hardware operation.
- **MQTT Camera Bridge**: Ingestion of ESP32-CAM status, event telemetry, and high-resolution JPEG snapshots.
- **LCom Protocol & Polling**: RS-485 packet framing, CRC/XOR checksums, and real-time pin deck observation.
- **WebSocket Event Bus**: Live score updates, pin states, and camera streams for operator UI and TV displays.

## Quick Start
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```
