#ifndef MQTT_TOPICS_H
#define MQTT_TOPICS_H

#include <Arduino.h>
#include "config.h"

// ============================================================
// MQTT Topic structure: camera/{camera_id}/{suffix}
// ============================================================

namespace topics {

// Maximum topic length
static const size_t MAX_TOPIC_LEN = 128;

// Build topic string from camera_id and suffix
inline String buildTopic(const String& cameraId, const char* suffix) {
    return "camera/" + cameraId + "/" + suffix;
}

// Topic suffixes
const char* const STATUS   = "status";     // retained, QoS 0
const char* const CMD      = "cmd";        // subscribe, QoS 1
const char* const RESULT   = "result";     // publish, QoS 1
const char* const SNAPSHOT = "snapshot";   // raw JPEG, QoS 1
const char* const EVENTS   = "events";     // QoS 0

} // namespace topics

#endif // MQTT_TOPICS_H
