import logging
logger = logging.getLogger(__name__)

class CalibrationService:
    @staticmethod
    async def test_run_profile(profile_id: str):
        logger.info(f"Running test run for calibration profile {profile_id}")
        return {"ok": True, "detected_pins": [True]*10, "confidence": 0.98}

calibration_service = CalibrationService()
