#include "tcp_framing.h"
#include "config.h"
#include "crc8.h"

bool packFrame(const LComFrame& frame, uint8_t* buffer, size_t bufferSize, size_t& frameSize) {
    if (bufferSize < 5 + frame.payload.size()) return false;
    
    buffer[0] = FRAME_START_1;
    buffer[1] = FRAME_START_2;
    buffer[2] = frame.cmd;
    buffer[3] = (uint8_t)frame.payload.size();
    for (size_t i = 0; i < frame.payload.size(); i++) {
        buffer[4 + i] = frame.payload[i];
    }
    
    uint8_t crc = calculateCRC8(buffer, 4 + frame.payload.size());
    buffer[4 + frame.payload.size()] = crc;
    
    frameSize = 5 + frame.payload.size();
    return true;
}

bool unpackFrame(const uint8_t* buffer, size_t size, LComFrame& frame) {
    if (size < 5) return false;
    if (buffer[0] != FRAME_START_1 || buffer[1] != FRAME_START_2) return false;
    
    uint8_t payloadLen = buffer[3];
    if (size < 5 + payloadLen) return false;
    
    uint8_t receivedCrc = buffer[4 + payloadLen];
    uint8_t calculatedCrc = calculateCRC8(buffer, 4 + payloadLen);
    
    if (receivedCrc != calculatedCrc) return false;
    
    frame.cmd = buffer[2];
    frame.payload.assign(buffer + 4, buffer + 4 + payloadLen);
    
    return true;
}
