#include "camera.h"
#include "config.h"
#include "logging.h"

// ============================================================
// AI-Thinker ESP32-CAM pin definitions
// ============================================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5

#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define LED_FLASH_PIN      4

// ============================================================
// Module state
// ============================================================
static bool s_initialized = false;
static sensor_t* s_sensor = nullptr;

namespace camera {

bool init() {
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sccb_sda = SIOD_GPIO_NUM;
    config.pin_sccb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = CAM_XCLK_FREQ_HZ;
    config.pixel_format = PIXFORMAT_JPEG;
    config.frame_size = CAM_FRAMESIZE;
    config.jpeg_quality = CAM_JPEG_QUALITY;
    config.fb_count = CAM_FB_COUNT;
    config.grab_mode = (camera_grab_mode_t)CAM_GRAB_MODE;
    config.fb_location = CAMERA_FB_IN_PSRAM;

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        LOG_ERROR("Camera init failed with error 0x%x", err);
        return false;
    }

    s_sensor = esp_camera_sensor_get();
    if (s_sensor == nullptr) {
        LOG_ERROR("Failed to get camera sensor");
        return false;
    }

    // Optimize sensor for pin detection
    s_sensor->set_brightness(s_sensor, 1);
    s_sensor->set_contrast(s_sensor, 1);
    s_sensor->set_saturation(s_sensor, 1);
    s_sensor->set_whitebal(s_sensor, 1);       // AWB on
    s_sensor->set_awb_gain(s_sensor, 1);
    s_sensor->set_wb_mode(s_sensor, 0);        // Auto
    s_sensor->set_exposure_ctrl(s_sensor, 1);  // AEC on
    s_sensor->set_aec2(s_sensor, 0);
    s_sensor->set_ae_level(s_sensor, 0);
    s_sensor->set_gain_ctrl(s_sensor, 1);      // AGC on
    s_sensor->set_gainceiling(s_sensor, (gainceiling_t)6);
    s_sensor->set_bpc(s_sensor, 0);
    s_sensor->set_wpc(s_sensor, 1);
    s_sensor->set_raw_gma(s_sensor, 1);
    s_sensor->set_lenc(s_sensor, 1);
    s_sensor->set_hmirror(s_sensor, 0);
    s_sensor->set_vflip(s_sensor, 0);
    s_sensor->set_dcw(s_sensor, 1);
    s_sensor->set_colorbar(s_sensor, 0);

    // Turn off flash LED by default
    pinMode(LED_FLASH_PIN, OUTPUT);
    digitalWrite(LED_FLASH_PIN, LOW);

    s_initialized = true;
    LOG_INFO("Camera initialized: %s, quality=%d", getFrameSizeStr(), CAM_JPEG_QUALITY);
    return true;
}

bool capture(camera_fb_t** fb) {
    if (!s_initialized) {
        LOG_ERROR("Camera not initialized");
        return false;
    }

    *fb = esp_camera_fb_get();
    if (*fb == nullptr) {
        LOG_ERROR("Camera capture failed: fb_get returned NULL");
        return false;
    }

    if ((*fb)->format != PIXFORMAT_JPEG) {
        LOG_ERROR("Camera capture: unexpected format %d", (*fb)->format);
        esp_camera_fb_return(*fb);
        *fb = nullptr;
        return false;
    }

    return true;
}

void setQuality(int quality) {
    if (!s_sensor) return;
    quality = constrain(quality, 0, 63);
    s_sensor->set_quality(s_sensor, quality);
    LOG_INFO("JPEG quality set to %d", quality);
}

bool setFrameSize(framesize_t framesize) {
    if (!s_sensor) return false;
    int res = s_sensor->set_framesize(s_sensor, framesize);
    if (res != 0) {
        LOG_ERROR("Failed to set framesize to %d", framesize);
        return false;
    }
    LOG_INFO("Frame size set to %d", framesize);
    return true;
}

const char* getFrameSizeStr() {
    if (!s_sensor) return "unknown";
    switch (s_sensor->status.framesize) {
        case FRAMESIZE_QQVGA:  return "QQVGA";
        case FRAMESIZE_QVGA:   return "QVGA";
        case FRAMESIZE_VGA:    return "VGA";
        case FRAMESIZE_SVGA:   return "SVGA";
        case FRAMESIZE_XGA:    return "XGA";
        case FRAMESIZE_SXGA:   return "SXGA";
        case FRAMESIZE_UXGA:   return "UXGA";
        default:               return "unknown";
    }
}

framesize_t parseFrameSize(const char* name) {
    if (strcmp(name, "QQVGA") == 0) return FRAMESIZE_QQVGA;
    if (strcmp(name, "QVGA") == 0)  return FRAMESIZE_QVGA;
    if (strcmp(name, "VGA") == 0)   return FRAMESIZE_VGA;
    if (strcmp(name, "SVGA") == 0)  return FRAMESIZE_SVGA;
    if (strcmp(name, "XGA") == 0)   return FRAMESIZE_XGA;
    if (strcmp(name, "SXGA") == 0)  return FRAMESIZE_SXGA;
    if (strcmp(name, "UXGA") == 0)  return FRAMESIZE_UXGA;
    return FRAMESIZE_SVGA; // default
}

void getResolution(uint16_t* width, uint16_t* height) {
    if (!s_sensor) {
        *width = 0; *height = 0;
        return;
    }
    const auto res = resolution[s_sensor->status.framesize];
    *width = res.width;
    *height = res.height;
}

bool isReady() {
    return s_initialized;
}

} // namespace camera
