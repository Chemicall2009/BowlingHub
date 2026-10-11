#include "status_reporter.h"
#include "config.h"
#include "logging.h"
#include "mqtt_topics.h"
#include "mqtt_client.h"
#include "wifi_manager.h"

#include <ArduinoJson.h>
#include <WiFi.h>

// ============================================================
// Module state
// ============================================================
static String s_camera_id;
static String s_topic_status;
static unsigned long s_last_publish = 0;
static unsigned long s_boot_time = 0;
static const char* s_reset_reason = "power_on";

// External stats from command_handler
extern uint32_t command_handler_get_snapshots_total();
extern uint32_t command_handler_get_errors_total();
extern const char* command_handler_get_last_snapshot();

namespace status_reporter {

void init(const String& camera_id) {
    s_camera_id = camera_id;
    s_topic_status = topics::buildTopic(camera_id, topics::STATUS);
    s_boot_time = millis();

    // Determine reset reason
    esp_reset_reason_t reason = esp_reset_reason();
    switch (reason) {
        case ESP_RST_POWERON:  s_reset_reason = "power_on"; break;
        case ESP_RST_EXT:      s_reset_reason = "external"; break;
        case ESP_RST_SW:       s_reset_reason = "software"; break;
        case ESP_RST_PANIC:    s_reset_reason = "panic"; break;
        case ESP_RST_INT_WDT:  s_reset_reason = "int_watchdog"; break;
        case ESP_RST_TASK_WDT: s_reset_reason = "task_watchdog"; break;
        case ESP_RST_WDT:      s_reset_reason = "watchdog"; break;
        case ESP_RST_DEEPSLEEP: s_reset_reason = "deep_sleep"; break;
        case ESP_RST_BROWNOUT: s_reset_reason = "brownout"; break;
        case ESP_RST_SDIO:     s_reset_reason = "sdio"; break;
        default:               s_reset_reason = "unknown"; break;
    }

    LOG_INFO("Status reporter initialized, reset reason: %s", s_reset_reason);
}

void publish() {
    wifi_manager::Config& cfg = wifi_manager::getConfig();

    StaticJsonDocument<1024> doc;
    doc["camera_id"] = s_camera_id;
    doc["version"] = FIRMWARE_VERSION;
    doc["uptime_sec"] = (millis() - s_boot_time) / 1000;
    doc["wifi_rssi"] = wifi_manager::getRSSI();
    doc["wifi_ssid"] = WiFi.SSID();
    doc["ip"] = wifi_manager::getIP();
    doc["mqtt_connected"] = mqtt_client::isConnected();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["psram_free"] = ESP.getFreePsram();

    // Lane IDs array
    JsonArray lanes = doc["lane_ids"].to<JsonArray>();
    for (int i = 0; i < cfg.lane_count; i++) {
        lanes.add(cfg.lane_ids[i]);
    }

    doc["mode"] = cfg.camera_mode;
    doc["last_snapshot_at"] = command_handler_get_last_snapshot();
    doc["snapshots_total"] = command_handler_get_snapshots_total();
    doc["errors_total"] = command_handler_get_errors_total();
    doc["reset_reason"] = s_reset_reason;

    String payload;
    serializeJson(doc, payload);

    // Publish as retained, QoS 0
    mqtt_client::publishJson(s_topic_status, payload, true, 0);
    s_last_publish = millis();

    LOG_DEBUG("Status published: heap=%u, psram=%u, rssi=%d",
              ESP.getFreeHeap(), ESP.getFreePsram(), WiFi.RSSI());
}

void loop() {
    if (millis() - s_last_publish >= STATUS_INTERVAL_MS) {
        if (mqtt_client::isConnected()) {
            publish();
        }
    }
}

void publishNow() {
    publish();
}

} // namespace status_reporter
