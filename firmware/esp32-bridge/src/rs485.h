#ifndef RS485_H
#define RS485_H

#include <Arduino.h>
#include "config.h"

class RS485 {
public:
    void begin(long baud);
    size_t write(const uint8_t *data, size_t len);
    int read();
    int available();
    
private:
    void setTxMode();
    void setRxMode();
};

#endif
