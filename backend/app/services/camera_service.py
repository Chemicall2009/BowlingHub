import uuid
from app.mqtt.client import MQTTClient
from app.mqtt.topics import cmd_topic

class CameraService:
    def __init__(self, mqtt_client: MQTTClient):
        self.mqtt = mqtt_client
    
    async def request_snapshot(self, camera_id, lane_id):
        request_id = str(uuid.uuid4())
        self.mqtt.publish(cmd_topic(camera_id), {"action": "snapshot", "request_id": request_id})
        return request_id
