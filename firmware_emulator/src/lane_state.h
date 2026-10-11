#ifndef LANE_STATE_H
#define LANE_STATE_H

#include <stdint.h>

struct LaneState {
    uint8_t pinState[2]; // Simplified: just 2 bytes for now
    uint8_t xorMask;
};

void applyXorMask(uint8_t* data, size_t len, uint8_t mask);
void updateLaneState(LaneState& state);

#endif
