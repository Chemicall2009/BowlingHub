/**
 * @file app/services/listen_parser.py
 * @description Listens on RS-485 LCom bus in listen-only mode, parses frames, updates scoring and event bus.
 */

import asyncio
import logging
from app.config import settings
from app.transport.base import Transport
from app.services.event_bus import event_bus
from app.services.scoring import scoring_engine
from app.models.log import CommandLog
from app.db import Session
from app.lcom.frame import LComFrame

logger = logging.getLogger(__name__)

def ticks_to_kmh(ticks: int | None) -> float | None:
    if not ticks:
        return None
    return round(settings.speed_k / ticks, 1)

class ListenParserService:
    def __init__(self, transport: Transport):
        self.transport = transport
        self.transport.listen_only = True
        self._task: asyncio.Task | None = None
        self._running = False

    async def start(self):
        if self._running:
            return
        self._running = True
        try:
            await self.transport.open()
        except Exception as e:
            logger.error(f"[ListenParser] Failed to open transport: {e}")
            self._running = False
            return
        self._task = asyncio.create_task(self._loop())
        logger.info("[ListenParser] Started listen-only parser service.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("[ListenParser] Stopped listen-only parser service.")

    async def _loop(self):
        buffer = bytearray()
        while self._running:
            try:
                chunk = await self.transport.read(64)
                if not chunk:
                    await asyncio.sleep(0.01)
                    continue
                buffer.extend(chunk)

                # Process frames of length settings.frame_length
                frame_len = settings.frame_length
                while len(buffer) >= frame_len:
                    frame_bytes = bytes(buffer[:frame_len])
                    del buffer[:frame_len]
                    await self._handle_frame(frame_bytes)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[ListenParser] Error in loop: {e}")
                await asyncio.sleep(0.5)

    async def _handle_frame(self, raw: bytes):
        try:
            frame = LComFrame.parse(raw)
        except Exception:
            # Invalid frame or framing
            return

        lane_id = getattr(frame, "lane_id", 1)
        cmd = getattr(frame, "command", 0)
        data = getattr(frame, "data", bytes())

        # Log frame in CommandLog
        try:
            with Session() as db:
                log_entry = CommandLog(
                    source="listen",
                    lane_id=lane_id,
                    direction="RX",
                    raw_hex=raw.hex(),
                    parsed=f"cmd=0x{cmd:02X}"
                )
                db.add(log_entry)
                db.commit()
        except Exception as ex:
            logger.error(f"[ListenParser] Failed to log frame: {ex}")

        # Dispatch based on command
        if cmd == 0x40:
            # Pin state, foul, split, speed
            pins = [bool(b) for b in data[:10]] if len(data) >= 10 else [True]*10
            foul = bool(data[10]) if len(data) > 10 else False
            split = bool(data[11]) if len(data) > 11 else False
            ticks = int.from_bytes(data[12:14], "big") if len(data) >= 14 else None
            speed_kmh = ticks_to_kmh(ticks)

            # Emit pins changed & TV events
            await event_bus.emit(f"lane.{lane_id}", {
                "type": "tv.pins_changed",
                "lane_id": lane_id,
                "pins": pins,
                "foul": foul,
                "split": split,
                "speed_kmh": speed_kmh,
                "timestamp": asyncio.get_event_loop().time()
            })

            # Observe shot in scoring engine
            pins_down = sum(1 for p in pins if not p)
            await scoring_engine.observe_shot(
                lane_id=lane_id,
                pins_down=pins_down,
                foul=foul,
                split=split,
                speed_kmh=speed_kmh
            )

        elif cmd == 0x03:
            # Player changed / info
            player_name = data[2:12].decode("latin1", errors="ignore").strip() if len(data) >= 12 else "Player"
            player_id = data[12] if len(data) > 12 else 1
            await event_bus.emit(f"lane.{lane_id}", {
                "type": "tv.player_changed",
                "lane_id": lane_id,
                "player_name": player_name,
                "player_id": player_id
            })

        elif cmd == 0x01:
            # Reset
            await event_bus.emit(f"lane.{lane_id}", {
                "type": "tv.lane_reset",
                "lane_id": lane_id
            })

        elif cmd == 0x02:
            # Options changed
            options = {"masking": data[2] if len(data) > 2 else 0}
            await event_bus.emit(f"lane.{lane_id}", {
                "type": "tv.options_changed",
                "lane_id": lane_id,
                "options": options
            })
