#include "mqtt_client.h"
#include "config.h"
#include "logging.h"

#include <WiFi.h>
#include <PubSubClient.h>

// ============================================================
// Module state
// ============================================================
static WiFiClient s_wifi_client;
static PubSubClient s_mqtt_client(s_wifi_client);
static mqtt_client::MessageCallback s_callback = nullptr;
static unsigned long s_last_reconnect_attempt = 0;
static unsigned long s_reconnect_backoff = 1000;
static char s_host[64];
static uint16_t s_port;
static char s_user[32];
static char s_pass[64];
static char s_client_id[32];
static char s_lwt_topic[128];
static char s_lwt_payload[256];

// ============================================================
// Internal callback adapter
// ============================================================
static void internalCallback(char* topic, uint8_t* payload, unsigned int length) {
    if (s_callback) {
        s_callback(String(topic), payload, length);
    }
}

namespace mqtt_client {

void init(const char* host, uint16_t port, const char* user, const char* pass,
          const char* client_id, const char* lwt_topic, const char* lwt_payload) {

    strncpy(s_host, host, sizeof(s_host) - 1);
    s_port = port;
    strncpy(s_user, user, sizeof(s_user) - 1);
    strncpy(s_pass, pass, sizeof(s_pass) - 1);
    strncpy(s_client_id, client_id, sizeof(s_client_id) - 1);
    strncpy(s_lwt_topic, lwt_topic, sizeof(s_lwt_topic) - 1);
    strncpy(s_lwt_payload, lwt_payload, sizeof(s_lwt_payload) - 1);

    s_mqtt_client.setServer(s_host, s_port);
    s_mqtt_client.setCallback(internalCallback);
    s_mqtt_client.setBufferSize(MQTT_BUFFER_SIZE);
    s_mqtt_client.setKeepAlive(60);
    s_mqtt_client.setSocketTimeout(15);

    LOG_INFO("MQTT client configured: %s:%d, id=%s", s_host, s_port, s_client_id);
}

void setCallback(MessageCallback cb) {
    s_callback = cb;
}

bool connect() {
    LOG_INFO("MQTT connecting to %s:%d...", s_host, s_port);

    bool result;
    if (strlen(s_user) > 0) {
        result = s_mqtt_client.connect(
            s_client_id, s_user, s_pass,
            s_lwt_topic, 0, true, s_lwt_payload
        );
    } else {
        result = s_mqtt_client.connect(
            s_client_id, nullptr, nullptr,
            s_lwt_topic, 0, true, s_lwt_payload
        );
    }

    if (result) {
        LOG_INFO("MQTT connected successfully");
        s_reconnect_backoff = 1000;
    } else {
        LOG_ERROR("MQTT connection failed, rc=%d", s_mqtt_client.state());
    }

    return result;
}

void disconnect() {
    s_mqtt_client.disconnect();
    LOG_INFO("MQTT disconnected");
}

void loop() {
    s_mqtt_client.loop();
}

bool isConnected() {
    return s_mqtt_client.connected();
}

bool publishJson(const String& topic, const String& payload, bool retained, int qos) {
    if (!isConnected()) {
        LOG_WARN("MQTT not connected, cannot publish to %s", topic.c_str());
        return false;
    }

    bool result = s_mqtt_client.publish(topic.c_str(), payload.c_str(), retained);
    if (!result) {
        LOG_ERROR("MQTT publish failed to %s", topic.c_str());
    }
    return result;
}

bool publishRaw(const String& topic, const uint8_t* data, size_t length) {
    if (!isConnected()) {
        LOG_WARN("MQTT not connected, cannot publish raw to %s", topic.c_str());
        return false;
    }

    // Use streaming publish to avoid buffering entire JPEG in heap
    if (!s_mqtt_client.beginPublish(topic.c_str(), length, false)) {
        LOG_ERROR("MQTT beginPublish failed for %s (%zu bytes)", topic.c_str(), length);
        return false;
    }

    // Write in chunks to avoid stack overflow
    const size_t CHUNK_SIZE = 4096;
    size_t offset = 0;
    while (offset < length) {
        size_t chunk = min(CHUNK_SIZE, length - offset);
        size_t written = s_mqtt_client.write(data + offset, chunk);
        if (written != chunk) {
            LOG_ERROR("MQTT write failed at offset %zu", offset);
            return false;
        }
        offset += chunk;
    }

    if (!s_mqtt_client.endPublish()) {
        LOG_ERROR("MQTT endPublish failed for %s", topic.c_str());
        return false;
    }

    LOG_DEBUG("Published %zu bytes to %s", length, topic.c_str());
    return true;
}

bool subscribe(const String& topic, int qos) {
    if (!isConnected()) {
        LOG_WARN("MQTT not connected, cannot subscribe to %s", topic.c_str());
        return false;
    }

    if (!s_mqtt_client.subscribe(topic.c_str(), qos)) {
        LOG_ERROR("MQTT subscribe failed for %s", topic.c_str());
        return false;
    }

    LOG_INFO("Subscribed to %s (QoS %d)", topic.c_str(), qos);
    return true;
}

bool reconnect() {
    if (isConnected()) return true;

    unsigned long now = millis();
    if (now - s_last_reconnect_attempt < s_reconnect_backoff) {
        return false;
    }
    s_last_reconnect_attempt = now;

    LOG_WARN("MQTT reconnect attempt (backoff: %lu ms)", s_reconnect_backoff);
    bool result = connect();

    if (!result) {
        s_reconnect_backoff = min(s_reconnect_backoff * 2, (unsigned long)MAX_RECONNECT_BACKOFF);
    }

    return result;
}

const char* getStateStr() {
    switch (s_mqtt_client.state()) {
        case MQTT_CONNECTED:         return "connected";
        case MQTT_CONNECTION_TIMEOUT:   return "timeout";
        case MQTT_CONNECTION_LOST:   return "lost";
        case MQTT_CONNECT_BAD_PROTOCOL: return "bad_protocol";
        case MQTT_CONNECT_BAD_CLIENT_ID: return "bad_client_id";
        case MQTT_CONNECT_UNAVAILABLE: return "unavailable";
        case MQTT_CONNECT_BAD_CREDENTIALS: return "bad_credentials";
        case MQTT_CONNECT_UNAUTHORIZED:      return "unauthorized";
        case -1:                     return "disconnected";
        default:                     return "unknown";
    }
}

} // namespace mqtt_client
