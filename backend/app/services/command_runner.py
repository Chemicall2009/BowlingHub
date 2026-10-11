import logging
logger = logging.getLogger(__name__)

class CommandRunner:
    @staticmethod
    async def execute_command(command_name: str, payload: dict):
        logger.info(f"Executing command {command_name} with payload {payload}")
        return {"ok": True, "result": "executed"}

command_runner = CommandRunner()
