class SnapshotService:
    async def save_snapshot(self, camera_id, lane_id, jpeg_bytes, request_id=None):
        if jpeg_bytes[:2] != b'\xFF\xD8':
            raise ValueError("Invalid JPEG")
        # Save logic
        pass
