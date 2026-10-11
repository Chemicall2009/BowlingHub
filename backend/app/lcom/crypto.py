from dataclasses import dataclass
@dataclass
class XorMask:
    mask: int
    def apply(self, data):
        return bytes([b ^ self.mask for b in data])
