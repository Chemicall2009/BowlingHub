#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>

// ============================================================
// WiFi Manager — connection + captive portal for setup
// ============================================================

namespace wifi_manager {

/**
 * Configuration data for WiFi and MQTT
 */
struct Config {
    char wifi_ssid[64];
    char wifi_pass[64];
    char mqtt_host[64];
    uint16_t mqtt_port;
    char mqtt_user[32];
    char mqtt_pass[64];
    char camera_id[32];
    char camera_mode[16];
    int lane_ids[2];
    int lane_count;
};

/**
 * Initialize WiFi manager, load config from NVS
 */
void init();

/**
 * Get current configuration
 */
Config& getConfig();

/**
 * Save configuration to NVS
 */
void saveConfig(const Config& cfg);

/**
 * Load configuration from NVS
 * @return true if valid config was loaded (WiFi SSID not empty)
 */
bool loadConfig();

/**
 * Try to connect to WiFi (non-blocking)
 * @return true if connected
 */
bool connect();

/**
 * Start AP mode with captive portal
 */
void startAP();

/**
 * Process captive portal (call in loop when in AP mode)
 */
void processAP();

/**
 * Check if WiFi is connected
 */
bool isConnected();

/**
 * Get current WiFi RSSI
 */
int getRSSI();

/**
 * Get IP address as string
 */
String getIP();

/**
 * Get MAC address (last 4 chars)
 */
String getMACSuffix();

/**
 * Attempt reconnect with backoff
 * @return true if reconnected
 */
bool reconnect();

/**
 * Check if in AP mode
 */
bool isAPMode();

} // namespace wifi_manager

#endif // WIFI_MANAGER_H
