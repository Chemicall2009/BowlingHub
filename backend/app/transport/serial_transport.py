import asyncio
import serial_asyncio
from .base import Transport
from app.config import settings

class SerialTransport(Transport):
    def __init__(self, listen_only: bool = False):
        super().__init__(listen_only=listen_only)
        self.reader = None
        self.writer = None

    async def open(self):
        self.reader, self.writer = await serial_asyncio.open_serial_connection(
            url=settings.serial_port, baudrate=settings.serial_baud
        )

    async def write(self, data):
        if self.listen_only:
            raise RuntimeError("write forbidden in listen-only mode")
        self.writer.write(data)

    async def read(self, n: int) -> bytes:
        if not self.reader:
            raise RuntimeError("Transport not open")
        return await self.reader.read(n)

