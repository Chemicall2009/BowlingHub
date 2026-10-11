#include "rs485.h"

void RS485::begin(long baud) {
    Serial.begin(baud);
    pinMode(RS485_RE_PIN, OUTPUT);
    pinMode(RS485_DE_PIN, OUTPUT);
    setRxMode();
}

void RS485::setTxMode() {
    digitalWrite(RS485_RE_PIN, HIGH);
    digitalWrite(RS485_DE_PIN, HIGH);
}

void RS485::setRxMode() {
    digitalWrite(RS485_RE_PIN, LOW);
    digitalWrite(RS485_DE_PIN, LOW);
}

size_t RS485::write(const uint8_t *data, size_t len) {
    setTxMode();
    size_t written = Serial.write(data, len);
    Serial.flush();
    setRxMode();
    return written;
}

int RS485::read() {
    return Serial.read();
}

int RS485::available() {
    return Serial.available();
}
