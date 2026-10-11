#ifndef LCOM_BRIDGE_H
#define LCOM_BRIDGE_H

#include <WiFiClient.h>
#include "rs485.h"
#include "tcp_framing.h"

class LComBridge {
public:
    void handle(WiFiClient& client, RS485& rs485);
};

#endif
