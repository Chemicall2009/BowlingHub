from abc import ABC, abstractmethod

class Transport(ABC):
    def __init__(self, listen_only: bool = False):
        self.listen_only = listen_only

    @abstractmethod
    async def open(self): pass

    @abstractmethod
    async def write(self, data):
        if self.listen_only:
            raise RuntimeError("write forbidden in listen-only mode")

    async def read(self, n: int) -> bytes:
        raise NotImplementedError

