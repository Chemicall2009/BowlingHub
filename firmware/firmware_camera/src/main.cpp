#include <Arduino.h>
#include <esp_task_wdt.h>
#include <esp_system.h>
#include <ArduinoJson.h>

#include "config.h"
#include "logging.h"
#include "camera.h"
#include "wifi_manager.h"
#include "mqtt_client.h"
#include "mqtt_topics.h"
#include "command_handler.h"
#include "status_reporter.h"

// ============================================================
// Global state
// ============================================================
static bool s_wifi_connected = false;
static bool s_mqtt_connected = false;
static TaskHandle_t s_wdt_task_handle = nullptr;

// ============================================================
// MQTT message callback
// ============================================================
static void onMqttMessage(const String& topic, const uint8_t* payload, unsigned int length) {
    String cmd_topic = topics::buildTopic(wifi_manager::getConfig().camera_id, topics::CMD);

    if (topic == cmd_topic) {
        LOG_INFO("CMD received on %s (%u bytes)", topic.c_str(), length);
        command_handler::handleCommand(payload, length);
    } else {
        LOG_WARN("Unexpected message on %s", topic.c_str());
    }
}

// ============================================================
// Publish LWT (Last Will and Testament) offline status
// ============================================================
static String buildLWTPayload() {
    StaticJsonDocument<512> doc;
    doc["camera_id"] = wifi_manager::getConfig().camera_id;
    doc["version"] = FIRMWARE_VERSION;
    doc["mqtt_connected"] = false;
    doc["event"] = "offline";
    doc["timestamp"] = "offline";

    String payload;
    serializeJson(doc, payload);
    return payload;
}

// ============================================================
// Watchdog setup
// ============================================================
static void initWatchdog() {
    
    
    esp_err_t err = esp_task_wdt_init(WDT_TIMEOUT_S, true);
    if (err != ESP_OK) {
        LOG_ERROR("WDT init failed: %d", err);
    } else {
        // Register current task (main loop task)
        err = esp_task_wdt_add(NULL);
        if (err != ESP_OK) {
            LOG_ERROR("WDT add failed: %d", err);
        } else {
            LOG_INFO("Watchdog initialized: %d sec timeout", WDT_TIMEOUT_S);
        }
    }
}

// ============================================================
// setup()
// ============================================================
void setup() {
    // 1. Serial
    Serial.begin(115200);
    delay(100);

    // Log boot reason
    esp_reset_reason_t reason = esp_reset_reason();
    LOG_INFO("========================================");
    LOG_INFO("BOWLING CAMERA FIRMWARE v%s", FIRMWARE_VERSION);
    LOG_INFO("BOOT reason: %d", (int)reason);
    LOG_INFO("Free heap: %u, PSRAM: %u", ESP.getFreeHeap(), ESP.getFreePsram());
    LOG_INFO("========================================");

    // 2. Load config from NVS
    wifi_manager::init();
    bool has_config = wifi_manager::loadConfig();

    // 3. If no WiFi config — start AP + captive portal
    if (!has_config) {
        LOG_INFO("No WiFi configuration found — starting captive portal");
        wifi_manager::startAP();

        // In AP mode, we just serve the portal forever
        // Camera is not initialized in AP mode (no need)
        while (true) {
            wifi_manager::processAP();
            delay(10);
        }
    }

    // 4. Initialize camera
    LOG_INFO("Initializing camera...");
    if (!camera::init()) {
        LOG_ERROR("Camera init failed! Restarting in 5 sec...");
        delay(5000);
        ESP.restart();
    }

    // 5. Connect to WiFi
    LOG_INFO("Connecting to WiFi...");
    s_wifi_connected = wifi_manager::connect();

    if (!s_wifi_connected) {
        LOG_WARN("WiFi not connected, will retry in loop");
    }

    // 6. Connect to MQTT
    wifi_manager::Config& cfg = wifi_manager::getConfig();
    String client_id = String("bowcam-") + cfg.camera_id;
    String lwt_topic = topics::buildTopic(cfg.camera_id, topics::STATUS);
    String lwt_payload = buildLWTPayload();

    mqtt_client::init(
        cfg.mqtt_host, cfg.mqtt_port,
        cfg.mqtt_user, cfg.mqtt_pass,
        client_id.c_str(),
        lwt_topic.c_str(), lwt_payload.c_str()
    );

    mqtt_client::setCallback(onMqttMessage);

    if (s_wifi_connected) {
        s_mqtt_connected = mqtt_client::connect();
    }

    // 7. Initialize command handler
    command_handler::init(cfg.camera_id);

    // 8. Initialize status reporter
    status_reporter::init(cfg.camera_id);

    // 9. Publish initial status and subscribe to commands
    if (s_mqtt_connected) {
        status_reporter::publishNow();

        String cmd_topic = topics::buildTopic(cfg.camera_id, topics::CMD);
        mqtt_client::subscribe(cmd_topic, 1);

        // Publish boot event
        StaticJsonDocument<512> doc;
        doc["event"] = "boot";
        doc["timestamp"] = "boot";
        doc["message"] = "Camera started";
        doc["severity"] = "info";
        String events_topic = topics::buildTopic(cfg.camera_id, topics::EVENTS);
        String payload;
        serializeJson(doc, payload);
        mqtt_client::publishJson(events_topic, payload, false, 0);
    }

    // 10. Initialize watchdog
    initWatchdog();

    LOG_INFO("Setup complete. Entering main loop.");
}

// ============================================================
// loop()
// ============================================================
void loop() {
    // 1. Reset watchdog
    esp_task_wdt_reset();

    // 2. WiFi reconnect if disconnected
    if (!wifi_manager::isConnected()) {
        if (s_wifi_connected) {
            // Was connected, now lost
            LOG_WARN("WiFi disconnected");
            s_wifi_connected = false;
        }
        wifi_manager::reconnect();
        if (wifi_manager::isConnected()) {
            s_wifi_connected = true;
            LOG_INFO("WiFi reconnected: %s", wifi_manager::getIP().c_str());
        }
    } else {
        if (!s_wifi_connected) {
            s_wifi_connected = true;
            LOG_INFO("WiFi connected: %s", wifi_manager::getIP().c_str());
        }
    }

    // 3. MQTT reconnect if disconnected
    if (s_wifi_connected) {
        if (!mqtt_client::isConnected()) {
            if (s_mqtt_connected) {
                LOG_WARN("MQTT disconnected");
                s_mqtt_connected = false;
            }
            mqtt_client::reconnect();
            if (mqtt_client::isConnected()) {
                s_mqtt_connected = true;
                LOG_INFO("MQTT reconnected");

                // Re-subscribe to command topic
                wifi_manager::Config& cfg = wifi_manager::getConfig();
                String cmd_topic = topics::buildTopic(cfg.camera_id, topics::CMD);
                mqtt_client::subscribe(cmd_topic, 1);

                // Publish status immediately after reconnect
                status_reporter::publishNow();
            }
        } else {
            if (!s_mqtt_connected) {
                s_mqtt_connected = true;
            }
        }
    }

    // 4. Process MQTT incoming messages
    mqtt_client::loop();

    // 5. Status heartbeat (every 30 sec)
    status_reporter::loop();

    // 6. Process pending commands
    command_handler::processPending();

    // 7. Check for low heap
    static unsigned long last_heap_check = 0;
    if (millis() - last_heap_check > 60000) {
        last_heap_check = millis();
        uint32_t free_heap = ESP.getFreeHeap();
        if (free_heap < 50000) {
            LOG_WARN("Low heap: %u bytes", free_heap);
            StaticJsonDocument<512> doc;
            doc["event"] = "low_heap";
            doc["timestamp"] = "check";
            doc["message"] = String("Free heap: ") + free_heap + " bytes";
            doc["severity"] = "warn";
            wifi_manager::Config& cfg = wifi_manager::getConfig();
            String events_topic = topics::buildTopic(cfg.camera_id, topics::EVENTS);
            String payload;
            serializeJson(doc, payload);
            mqtt_client::publishJson(events_topic, payload, false, 0);
        }
    }

    // Small yield to prevent WDT on idle
    yield();
}
