#ifndef COMMAND_HANDLER_H
#define COMMAND_HANDLER_H

#include <Arduino.h>

// ============================================================
// Command handler — processes incoming MQTT commands
// ============================================================

namespace command_handler {

/**
 * Initialize command handler
 * @param camera_id Camera identifier for topic building
 */
void init(const String& camera_id);

/**
 * Process an incoming command message
 * @param payload JSON payload
 * @param length Payload length
 */
void handleCommand(const uint8_t* payload, unsigned int length);

/**
 * Check if there are pending commands to process
 * Call from main loop
 */
void processPending();

} // namespace command_handler

#endif // COMMAND_HANDLER_H
