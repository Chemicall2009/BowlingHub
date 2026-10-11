#ifndef LOGGING_H
#define LOGGING_H

#include <Arduino.h>

// ============================================================
// Logging macros with timestamps and levels
// ============================================================

#define LOG_TAG "[CAM]"

#define LOG_INFO(fmt, ...) \
    Serial.printf(LOG_TAG " [INFO] " fmt "\n", ##__VA_ARGS__)

#define LOG_WARN(fmt, ...) \
    Serial.printf(LOG_TAG " [WARN] " fmt "\n", ##__VA_ARGS__)

#define LOG_ERROR(fmt, ...) \
    Serial.printf(LOG_TAG " [ERROR] " fmt "\n", ##__VA_ARGS__)

#define LOG_DEBUG(fmt, ...) \
    Serial.printf(LOG_TAG " [DEBUG] " fmt "\n", ##__VA_ARGS__)

#endif // LOGGING_H
