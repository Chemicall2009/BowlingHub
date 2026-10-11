from .base import Transport
import asyncio

class MockTransport(Transport):
    def __init__(self, listen_only: bool = False):
        super().__init__(listen_only=listen_only)
        self.queue = asyncio.Queue()

    async def open(self):
        pass

    async def write(self, data):
        if self.listen_only:
            raise RuntimeError("write forbidden in listen-only mode")

    async def read(self, n: int) -> bytes:
        return await self.queue.get()

    async def push_mock_data(self, data: bytes):
        await self.queue.put(data)

