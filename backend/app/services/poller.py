import asyncio
import logging
from app.db import engine
from sqlmodel import Session, select
from app.models.lane import Lane
from app.services.event_bus import event_bus

logger = logging.getLogger(__name__)

class LanePoller:
    def __init__(self):
        self.running = False
        self._task = None

    async def start(self):
        if self.running:
            return
        self.running = True
        self._task = asyncio.create_task(self._poll_loop())
        logger.info("LanePoller started")

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("LanePoller stopped")

    async def _poll_loop(self):
        while self.running:
            try:
                await asyncio.sleep(0.05) # 50ms polling interval
                # Background polling simulation or actual transport poll
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in poller loop: {e}")

poller = LanePoller()
