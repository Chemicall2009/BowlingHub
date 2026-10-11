#include "command_handler.h"
#include "config.h"
#include "logging.h"
#include "mqtt_topics.h"
#include "camera.h"
#include "mqtt_client.h"
#include "wifi_manager.h"

#include <ArduinoJson.h>
#include <Preferences.h>

// ============================================================
// Module state
// ============================================================
static String s_camera_id;
static String s_topic_result;
static String s_topic_snapshot;
static String s_topic_events;

// Command queue (simple single-slot for now)
static bool s_has_pending = false;
static StaticJsonDocument<512> s_pending_cmd;

// Statistics
static uint32_t s_snapshots_total = 0;
static uint32_t s_errors_total = 0;
static String s_last_snapshot_at;

// ============================================================
// Helper functions
// ============================================================

static String getTimestamp() {
    // Simple monotonic timestamp (no NTP in this version)
    // Format: ISO-like with uptime
    unsigned long sec = millis() / 1000;
    char buf[32];
    snprintf(buf, sizeof(buf), "uptime:%lus", sec);
    return String(buf);
}

static void publishResult(const char* request_id, const char* action, bool ok,
                          const char* error = nullptr, const char* message = nullptr) {
    StaticJsonDocument<512> doc;
    doc["request_id"] = request_id;
    doc["action"] = action;
    doc["ok"] = ok;

    if (error) doc["error"] = error;
    if (message) doc["message"] = message;

    String payload;
    serializeJson(doc, payload);
    mqtt_client::publishJson(s_topic_result, payload, false, 1);
}

static void publishSnapshotResult(const char* request_id, const char* action,
                                   bool ok, unsigned long duration_ms,
                                   int lane_id, size_t jpeg_size) {
    StaticJsonDocument<512> doc;
    doc["request_id"] = request_id;
    doc["action"] = action;
    doc["ok"] = ok;
    doc["duration_ms"] = duration_ms;
    doc["captured_at"] = getTimestamp();

    if (lane_id > 0) {
        doc["lane_id"] = lane_id;
    }

    if (ok) {
        doc["jpeg_size_bytes"] = jpeg_size;
        uint16_t w, h;
        camera::getResolution(&w, &h);
        JsonObject res = doc["resolution"].to<JsonObject>();
        res["width"] = w;
        res["height"] = h;
    }

    String payload;
    serializeJson(doc, payload);
    mqtt_client::publishJson(s_topic_result, payload, false, 1);
}

static void publishEvent(const char* event, const char* message, const char* severity) {
    StaticJsonDocument<512> doc;
    doc["event"] = event;
    doc["timestamp"] = getTimestamp();
    doc["message"] = message;
    doc["severity"] = severity;

    String payload;
    serializeJson(doc, payload);
    mqtt_client::publishJson(s_topic_events, payload, false, 0);
}

// ============================================================
// Command processors
// ============================================================

static void handleSnapshot(const char* request_id, int lane_id) {
    unsigned long start = millis();

    camera_fb_t* fb = nullptr;
    bool ok = camera::capture(&fb);

    if (!ok || fb == nullptr) {
        s_errors_total++;
        unsigned long duration = millis() - start;
        publishSnapshotResult(request_id, "snapshot", false, duration, lane_id, 0);
        publishEvent("camera_error", "esp_camera_fb_get returned NULL", "error");
        LOG_ERROR("Snapshot failed");
        return;
    }

    // Publish raw JPEG
    bool published = mqtt_client::publishRaw(s_topic_snapshot, fb->buf, fb->len);
    size_t jpeg_size = fb->len;

    // Return framebuffer
    esp_camera_fb_return(fb);

    unsigned long duration = millis() - start;

    if (published) {
        s_snapshots_total++;
        s_last_snapshot_at = getTimestamp();
        publishSnapshotResult(request_id, "snapshot", true, duration, lane_id, jpeg_size);
        LOG_INFO("Snapshot OK: %zu bytes in %lu ms", jpeg_size, duration);
    } else {
        s_errors_total++;
        publishSnapshotResult(request_id, "snapshot", false, duration, lane_id, jpeg_size);
        publishEvent("camera_error", "MQTT publish failed", "error");
        LOG_ERROR("Snapshot publish failed");
    }
}

static void handlePing(const char* request_id) {
    publishResult(request_id, "ping", true);
    LOG_INFO("Ping OK");
}

static void handleReboot(const char* request_id) {
    publishResult(request_id, "reboot", true);
    LOG_INFO("Rebooting...");
    delay(500);
    ESP.restart();
}

static void handleSetQuality(const char* request_id, int value) {
    camera::setQuality(value);

    // Save to NVS
    Preferences prefs;
    prefs.begin("bowcam", false);
    prefs.putInt("quality", value);
    prefs.end();

    publishResult(request_id, "set_quality", true);
    publishEvent("config_changed", "JPEG quality updated", "info");
    LOG_INFO("Quality set to %d", value);
}

static void handleSetFramesize(const char* request_id, const char* value) {
    framesize_t fs = camera::parseFrameSize(value);
    bool ok = camera::setFrameSize(fs);

    if (ok) {
        // Save to NVS
        Preferences prefs;
        prefs.begin("bowcam", false);
        prefs.putString("framesize", value);
        prefs.end();

        publishResult(request_id, "set_framesize", true);
        publishEvent("config_changed", "Frame size updated", "info");
        LOG_INFO("Framesize set to %s", value);
    } else {
        s_errors_total++;
        publishResult(request_id, "set_framesize", false, "set_framesize_failed", "Invalid or unsupported framesize");
    }
}

// ============================================================
// Public API
// ============================================================

namespace command_handler {

void init(const String& camera_id) {
    s_camera_id = camera_id;
    s_topic_result = topics::buildTopic(camera_id, topics::RESULT);
    s_topic_snapshot = topics::buildTopic(camera_id, topics::SNAPSHOT);
    s_topic_events = topics::buildTopic(camera_id, topics::EVENTS);
    LOG_INFO("Command handler initialized for %s", camera_id.c_str());
}

void handleCommand(const uint8_t* payload, unsigned int length) {
    // Parse JSON
    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, payload, length);

    if (err) {
        LOG_ERROR("Command JSON parse error: %s", err.c_str());
        publishResult("unknown", "unknown", false, "json_parse_error", err.c_str());
        return;
    }

    const char* action = doc["action"] | "";
    const char* request_id = doc["request_id"] | "unknown";
    int lane_id = doc["lane_id"] | 0;

    LOG_INFO("Command received: action=%s, request_id=%s", action, request_id);

    if (strcmp(action, "snapshot") == 0) {
        handleSnapshot(request_id, lane_id);
    } else if (strcmp(action, "ping") == 0) {
        handlePing(request_id);
    } else if (strcmp(action, "reboot") == 0) {
        handleReboot(request_id);
    } else if (strcmp(action, "set_quality") == 0) {
        int value = doc["value"] | CAM_JPEG_QUALITY;
        handleSetQuality(request_id, value);
    } else if (strcmp(action, "set_framesize") == 0) {
        const char* value = doc["value"] | "SVGA";
        handleSetFramesize(request_id, value);
    } else {
        s_errors_total++;
        publishResult(request_id, action, false, "unknown_action", "Action not recognized");
        LOG_WARN("Unknown action: %s", action);
    }
}

void processPending() {
    // Currently commands are processed synchronously in handleCommand
    // This is a placeholder for async processing if needed
}

} // namespace command_handler

// Expose stats for status reporter
uint32_t command_handler_get_snapshots_total() { return s_snapshots_total; }
uint32_t command_handler_get_errors_total() { return s_errors_total; }
const char* command_handler_get_last_snapshot() { return s_last_snapshot_at.c_str(); }
