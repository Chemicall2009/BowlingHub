#ifndef STATUS_REPORTER_H
#define STATUS_REPORTER_H

#include <Arduino.h>

// ============================================================
// Status reporter — periodic heartbeat with system info
// ============================================================

namespace status_reporter {

/**
 * Initialize status reporter
 * @param camera_id Camera identifier
 */
void init(const String& camera_id);

/**
 * Publish status message (retained)
 */
void publish();

/**
 * Check if it's time to publish status
 * Call from main loop
 */
void loop();

/**
 * Force immediate status publish
 */
void publishNow();

} // namespace status_reporter

#endif // STATUS_REPORTER_H
