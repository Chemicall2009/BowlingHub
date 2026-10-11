import asyncio
import logging

logger = logging.getLogger(__name__)

class EventBus:
    def __init__(self):
        self.subscribers = []

    async def publish(self, event: dict):
        for sub in list(self.subscribers):
            try:
                if asyncio.iscoroutinefunction(sub):
                    await sub(event)
                else:
                    sub(event)
            except Exception as e:
                logger.error(f"Error in event subscriber: {e}")

    def subscribe(self, callback):
        self.subscribers.append(callback)
        def unsubscribe():
            if callback in self.subscribers:
                self.subscribers.remove(callback)
        return unsubscribe

event_bus = EventBus()

