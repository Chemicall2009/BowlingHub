from dataclasses import dataclass
@dataclass
class PinState:
    pins: tuple[bool, ...]
    foul1: bool
    foul2: bool
    split: bool
    speed: float
