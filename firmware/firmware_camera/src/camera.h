#ifndef CAMERA_H
#define CAMERA_H

#include <Arduino.h>
#include "esp_camera.h"

// ============================================================
// Camera module — OV2640 initialization and capture
// ============================================================

namespace camera {

/**
 * Initialize OV2640 camera with AI-Thinker pinout
 * @return true if successful
 */
bool init();

/**
 * Capture a JPEG frame
 * @param[out] fb Pointer to framebuffer (caller must return it)
 * @return true if successful
 */
bool capture(camera_fb_t** fb);

/**
 * Set JPEG quality (0-63, lower = better)
 */
void setQuality(int quality);

/**
 * Set frame size
 * @param framesize One of FRAMESIZE_* constants
 * @return true if successful
 */
bool setFrameSize(framesize_t framesize);

/**
 * Get current frame size as string
 */
const char* getFrameSizeStr();

/**
 * Parse framesize string to enum
 */
framesize_t parseFrameSize(const char* name);

/**
 * Get image resolution for current framesize
 */
void getResolution(uint16_t* width, uint16_t* height);

/**
 * Check if camera is initialized
 */
bool isReady();

} // namespace camera

#endif // CAMERA_H
