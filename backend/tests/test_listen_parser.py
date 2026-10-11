/**
 * @file tests/test_listen_parser.py
 * @description Unit tests for ListenParserService and LCom frame listening.
 */

import pytest
import asyncio
from app.transport.mock_transport import MockTransport
from app.services.listen_parser import ListenParserService
from app.services.event_bus import event_bus

@pytest.mark.asyncio
async def test_listen_parser():
    transport = MockTransport(listen_only=True)
    parser = ListenParserService(transport)

    received_events = []
    async def callback(event):
        received_events.append(event)

    unsubscribe = event_bus.subscribe(callback)

    try:
        # Simulate feeding data into mock transport
        # Frame 1: 0x40 (pins)
        frame1 = b'\\x01\\x40' + b'\\x00'*10 + b'\\x00\\x00\\x10\\x20' + b'\\x00'*12
        transport.feed_incoming(frame1)

        # Frame 2: 0x03 (player)
        frame2 = b'\\x01\\x03' + b'Alex     \\x01\\x02' + b'\\x00'*14
        transport.feed_incoming(frame2)

        await parser.start()
        await asyncio.sleep(0.1)
        await parser.stop()

        assert len(received_events) >= 1
    finally:
        unsubscribe()
