#ifndef CONFIG_H
#define CONFIG_H

// ============================================================
// Firmware identification
// ============================================================
#define FIRMWARE_VERSION "1.0.0"

// ============================================================
// Camera identification — unique per device
// ============================================================
#define DEFAULT_CAMERA_ID       "cam-01"
#define DEFAULT_LANE_IDS        {5, 6}
#define DEFAULT_CAMERA_MODE     "dual"   // "dual" or "single"

// ============================================================
// WiFi
// ============================================================
#define DEFAULT_WIFI_SSID       ""       // empty = captive portal
#define DEFAULT_WIFI_PASS       ""

// ============================================================
// MQTT
// ============================================================
#define DEFAULT_MQTT_HOST       "192.168.2.67"   // hub
#define DEFAULT_MQTT_PORT       1883
#define DEFAULT_MQTT_USER       ""
#define DEFAULT_MQTT_PASS       ""

// ============================================================
// Camera — optimized for pin counting
// ============================================================
#define CAM_FRAMESIZE           FRAMESIZE_SVGA   // 800x600
#define CAM_JPEG_QUALITY        12               // 0-63, lower = better
#define CAM_FB_COUNT            2                // 2 framebuffers in PSRAM
#define CAM_XCLK_FREQ_HZ        20000000
#define CAM_GRAB_MODE           CAMERA_GRAB_LATEST

// ============================================================
// Automation timers
// ============================================================
#define STATUS_INTERVAL_MS      30000
#define WIFI_RECONNECT_MS       5000
#define MQTT_RECONNECT_MS       5000
#define WDT_TIMEOUT_S           60
#define MAX_RECONNECT_BACKOFF   60000

// ============================================================
// Command timeouts
// ============================================================
#define SNAPSHOT_TIMEOUT_MS     5000

// ============================================================
// WiFi Manager
// ============================================================
#define WIFI_CONNECT_TIMEOUT_MS 30000
#define AP_SSID_PREFIX          "BowlingCam-"
#define AP_PASSWORD             "configure123"

// ============================================================
// MQTT payload limits
// ============================================================
#undef MQTT_MAX_PACKET_SIZE
#define MQTT_MAX_PACKET_SIZE    65535
#undef MQTT_BUFFER_SIZE
#define MQTT_BUFFER_SIZE        65535

#endif // CONFIG_H
