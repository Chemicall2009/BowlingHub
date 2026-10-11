#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <Arduino.h>
#include <PubSubClient.h>

// ============================================================
// MQTT Client wrapper with reconnect and LWT
// ============================================================

namespace mqtt_client {

/**
 * Callback type for incoming messages
 */
typedef void (*MessageCallback)(const String& topic, const uint8_t* payload, unsigned int length);

/**
 * Initialize MQTT client
 * @param host MQTT broker host
 * @param port MQTT broker port
 * @param user Username (can be empty)
 * @param pass Password (can be empty)
 * @param client_id MQTT client ID
 * @param lwt_topic Last Will topic
 * @param lwt_payload Last Will payload
 */
void init(const char* host, uint16_t port, const char* user, const char* pass,
          const char* client_id, const char* lwt_topic, const char* lwt_payload);

/**
 * Set callback for incoming messages
 */
void setCallback(MessageCallback cb);

/**
 * Connect to MQTT broker
 * @return true if connected
 */
bool connect();

/**
 * Disconnect from MQTT broker
 */
void disconnect();

/**
 * Process incoming messages (call in loop)
 */
void loop();

/**
 * Check if connected
 */
bool isConnected();

/**
 * Publish JSON message
 * @param topic Topic string
 * @param payload JSON string
 * @param retained Whether message is retained
 * @param qos QoS level (0 or 1)
 * @return true if published successfully
 */
bool publishJson(const String& topic, const String& payload, bool retained = false, int qos = 0);

/**
 * Publish raw binary data (for JPEG snapshots)
 * Uses beginPublish/write/endPublish to avoid buffering
 * @param topic Topic string
 * @param data Pointer to data
 * @param length Data length
 * @return true if published successfully
 */
bool publishRaw(const String& topic, const uint8_t* data, size_t length);

/**
 * Subscribe to topic
 * @param topic Topic string
 * @param qos QoS level
 * @return true if subscribed successfully
 */
bool subscribe(const String& topic, int qos = 1);

/**
 * Attempt reconnect with backoff
 * @return true if reconnected
 */
bool reconnect();

/**
 * Get connection state string for debugging
 */
const char* getStateStr();

} // namespace mqtt_client

#endif // MQTT_CLIENT_H
