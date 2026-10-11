#include "lane_state.h"

void applyXorMask(uint8_t* data, size_t len, uint8_t mask) {
    for (size_t i = 0; i < len; i++) {
        data[i] ^= mask;
    }
}

void updateLaneState(LaneState& state) {
    // Simulate physics: randomize pin state
    state.pinState[0] = rand() % 256;
    state.pinState[1] = rand() % 256;
}
