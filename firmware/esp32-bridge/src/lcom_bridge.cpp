#include "lcom_bridge.h"

void LComBridge::handle(WiFiClient& client, RS485& rs485) {
    // Read from TCP
    if (client.available()) {
        uint8_t buffer[256];
        int size = client.read(buffer, sizeof(buffer));
        
        LComFrame frame;
        if (unpackFrame(buffer, size, frame)) {
            if (frame.cmd == 0x01) {
                rs485.write(frame.payload.data(), frame.payload.size());
            }
        }
    }
    
    // Read from RS485
    if (rs485.available()) {
        uint8_t buffer[256];
        int len = 0;
        while(rs485.available() && len < 256) {
            buffer[len++] = rs485.read();
        }
        
        LComFrame frame;
        frame.cmd = 0x81;
        frame.payload.assign(buffer, buffer + len);
        
        uint8_t outBuffer[256];
        size_t outSize;
        if (packFrame(frame, outBuffer, 256, outSize)) {
            client.write(outBuffer, outSize);
        }
    }
}
