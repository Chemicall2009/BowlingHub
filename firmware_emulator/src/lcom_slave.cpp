#include "lcom_slave.h"

LComSlave::LComSlave(uint8_t address, uint8_t xorMask) : _address(address) {
    _state.xorMask = xorMask;
}

void LComSlave::begin() {
    Serial.begin(LCOM_BAUD);
    pinMode(RS485_RE_PIN, OUTPUT);
    pinMode(RS485_DE_PIN, OUTPUT);
    digitalWrite(RS485_RE_PIN, LOW); // RX Mode
    digitalWrite(RS485_DE_PIN, LOW);
}

void LComSlave::loop() {
    if (Serial.available() >= 5) {
        uint8_t header[2];
        Serial.readBytes(header, 2);
        
        if (header[0] == 0xAA && header[1] == 0x55) {
            uint8_t cmd = Serial.read();
            uint8_t len = Serial.read();
            uint8_t payload[len];
            Serial.readBytes(payload, len);
            uint8_t crc = Serial.read(); // Simplified

            handleCommand(cmd, payload, len);
        }
    }
}

void LComSlave::handleCommand(uint8_t cmd, uint8_t* payload, size_t len) {
    if (DEBUG_LCOM) {
        Serial.printf("Got cmd: 0x%02X\n", cmd);
    }
    
    // Minimal command handling
    if (cmd == 0x02) { // POLL_STATUS
        uint8_t resp[] = {0x40, _state.pinState[0], _state.pinState[1]};
        sendResponse(resp, sizeof(resp));
    }
}

void LComSlave::sendResponse(uint8_t* data, size_t len) {
    applyXorMask(data, len, _state.xorMask);
    
    digitalWrite(RS485_RE_PIN, HIGH); // TX Mode
    digitalWrite(RS485_DE_PIN, HIGH);
    delay(1);
    
    Serial.write(0xAA);
    Serial.write(0x55);
    Serial.write(data, len);
    
    Serial.flush();
    digitalWrite(RS485_RE_PIN, LOW); // RX Mode
    digitalWrite(RS485_DE_PIN, LOW);
}
