#include <Arduino.h>
#include "lcom_slave.h"

LComSlave emulator(0x01, 0xAA); // Address 0x01, Mask 0xAA

void setup() {
    emulator.begin();
}

void loop() {
    emulator.loop();
}
