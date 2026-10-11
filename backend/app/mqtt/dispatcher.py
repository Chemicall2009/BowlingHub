import re
import structlog
from .handlers import handle_status, handle_snapshot, handle_result, handle_events

logger = structlog.get_logger()
TOPIC_RE = re.compile(r"^camera/(?P<camera_id>[^/]+)/(?P<kind>status|cmd|result|snapshot|events)$")

async def dispatch(topic, payload):
    match = TOPIC_RE.match(topic)
    if not match:
        return
    
    kind = match.group("kind")
    camera_id = match.group("camera_id")
    
    handlers = {
        "status": handle_status,
        "snapshot": handle_snapshot,
        "result": handle_result,
        "events": handle_events
    }
    
    handler = handlers.get(kind)
    if handler:
        await handler(camera_id, payload)
