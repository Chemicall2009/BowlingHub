#include <Arduino.h>
#include <WiFi.h>
#include "rs485.h"
#include "lcom_bridge.h"

RS485 rs485;
LComBridge bridge;
WiFiServer server(2323);
WiFiClient client;

void setup() {
    Serial.begin(115200);
    rs485.begin(9600);
    
    WiFi.begin("SSID", "PASS");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
    }
    
    server.begin();
}

void loop() {
    if (!client.connected()) {
        client = server.available();
        return;
    }
    
    bridge.handle(client, rs485);
}
