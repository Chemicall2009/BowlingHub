import asyncio
import paho.mqtt.client as mqtt
import structlog
from app.config import settings

logger = structlog.get_logger()

class MQTTClient:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self._connected = asyncio.Event()

    def on_connect(self, client, userdata, flags, rc):
        logger.info("Connected to MQTT", rc=rc)
        self.client.subscribe("camera/+/+")
        self._connected.set()

    def on_message(self, client, userdata, msg):
        asyncio.get_event_loop().call_soon_threadsafe(
            lambda: asyncio.create_task(self.handle_message(msg))
        )

    async def handle_message(self, msg):
        # Dispatcher will be called here
        from .dispatcher import dispatch
        await dispatch(msg.topic, msg.payload)

    async def start(self):
        self.client.connect("192.168.2.67", 1883)
        self.client.loop_start()

    async def wait_connected(self, timeout=10):
        await asyncio.wait_for(self._connected.wait(), timeout=timeout)

    def publish(self, topic, payload, qos=0, retain=False):
        self.client.publish(topic, payload, qos=qos, retain=retain)
