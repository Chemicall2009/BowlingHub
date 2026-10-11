from dataclasses import dataclass
@dataclass(frozen=True)
class LComFrame:
    cmd: int
    lane_id: int
    payload: bytes
    checksum: int
    raw: bytes
    @classmethod
    def build(cls, cmd, lane_id, payload=None, *, xor_mask=0x00):
        # Implementation
        pass
    @classmethod
    def parse(cls, raw, *, xor_mask=0x00):
        # Implementation
        pass
