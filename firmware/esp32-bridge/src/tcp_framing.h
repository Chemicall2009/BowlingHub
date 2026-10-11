#ifndef TCP_FRAMING_H
#define TCP_FRAMING_H

#include <stdint.h>
#include <vector>

struct LComFrame {
    uint8_t cmd;
    std::vector<uint8_t> payload;
};

bool packFrame(const LComFrame& frame, uint8_t* buffer, size_t bufferSize, size_t& frameSize);
bool unpackFrame(const uint8_t* buffer, size_t size, LComFrame& frame);

#endif
