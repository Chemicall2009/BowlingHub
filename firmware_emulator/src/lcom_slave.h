#ifndef LCOM_SLAVE_H
#define LCOM_SLAVE_H

#include <Arduino.h>
#include "config.h"
#include "lane_state.h"

class LComSlave {
public:
    LComSlave(uint8_t address, uint8_t xorMask);
    void begin();
    void loop();

private:
    uint8_t _address;
    LaneState _state;
    void handleCommand(uint8_t cmd, uint8_t* payload, size_t len);
    void sendResponse(uint8_t* data, size_t len);
};

#endif
