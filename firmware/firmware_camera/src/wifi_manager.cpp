#include "wifi_manager.h"
#include "config.h"
#include "logging.h"

#include <WiFi.h>
#include <Preferences.h>
#include <WebServer.h>
#include <DNSServer.h>

// ============================================================
// Module state
// ============================================================
static wifi_manager::Config s_config;
static bool s_ap_mode = false;
static unsigned long s_last_reconnect_attempt = 0;
static unsigned long s_reconnect_backoff = 1000;
static Preferences s_prefs;

// Captive portal components
static WebServer* s_web_server = nullptr;
static DNSServer* s_dns_server = nullptr;

// ============================================================
// Captive portal HTML page (stored in PROGMEM)
// ============================================================
static const char PORTAL_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<title>Bowling Camera Setup</title>
<style>
body{font-family:Arial,sans-serif;max-width:480px;margin:40px auto;padding:20px;background:#1a1a2e;color:#eee}
h1{color:#e94560;text-align:center}
label{display:block;margin:12px 0 4px;font-weight:bold;color:#0f3460}
input,select{width:100%;padding:10px;border:1px solid #333;border-radius:6px;background:#16213e;color:#eee;font-size:14px;box-sizing:border-box}
input:focus{border-color:#e94560;outline:none}
button{width:100%;padding:12px;margin-top:20px;background:#e94560;color:#fff;border:none;border-radius:6px;font-size:16px;cursor:pointer}
button:hover{background:#c73e54}
.group{border:1px solid #333;padding:16px;border-radius:8px;margin:16px 0}
.group h2{margin:0 0 8px;color:#e94560;font-size:16px}
.row{display:flex;gap:10px}
.row>div{flex:1}
</style>
</head>
<body>
<h1>🎳 Bowling Cam Setup</h1>
<form method='POST' action='/save'>
<div class='group'>
<h2>WiFi</h2>
<label>SSID</label>
<input name='wifi_ssid' required>
<label>Password</label>
<input name='wifi_pass' type='password'>
</div>
<div class='group'>
<h2>MQTT Broker</h2>
<label>Host</label>
<input name='mqtt_host' value='192.168.2.67' required>
<label>Port</label>
<input name='mqtt_port' type='number' value='1883'>
<label>User (optional)</label>
<input name='mqtt_user'>
<label>Password (optional)</label>
<input name='mqtt_pass' type='password'>
</div>
<div class='group'>
<h2>Camera</h2>
<label>Camera ID</label>
<input name='camera_id' value='cam-01' required>
<label>Mode</label>
<select name='camera_mode'>
<option value='dual'>Dual (2 lanes)</option>
<option value='single'>Single (1 lane)</option>
</select>
<div class='row'>
<div>
<label>Lane 1</label>
<input name='lane1' type='number' value='5' min='1' max='40'>
</div>
<div>
<label>Lane 2</label>
<input name='lane2' type='number' value='6' min='1' max='40'>
</div>
</div>
</div>
<button type='submit'>Save & Reboot</button>
</form>
</body>
</html>
)rawliteral";

// ============================================================
// Implementation
// ============================================================

namespace wifi_manager {

void init() {
    // Set defaults
    memset(&s_config, 0, sizeof(s_config));
    strncpy(s_config.wifi_ssid, DEFAULT_WIFI_SSID, sizeof(s_config.wifi_ssid) - 1);
    strncpy(s_config.wifi_pass, DEFAULT_WIFI_PASS, sizeof(s_config.wifi_pass) - 1);
    strncpy(s_config.mqtt_host, DEFAULT_MQTT_HOST, sizeof(s_config.mqtt_host) - 1);
    s_config.mqtt_port = DEFAULT_MQTT_PORT;
    strncpy(s_config.mqtt_user, DEFAULT_MQTT_USER, sizeof(s_config.mqtt_user) - 1);
    strncpy(s_config.mqtt_pass, DEFAULT_MQTT_PASS, sizeof(s_config.mqtt_pass) - 1);
    strncpy(s_config.camera_id, DEFAULT_CAMERA_ID, sizeof(s_config.camera_id) - 1);
    strncpy(s_config.camera_mode, DEFAULT_CAMERA_MODE, sizeof(s_config.camera_mode) - 1);
    int default_lanes[] = DEFAULT_LANE_IDS;
    s_config.lane_ids[0] = default_lanes[0];
    s_config.lane_ids[1] = default_lanes[1];
    s_config.lane_count = 2;
}

Config& getConfig() {
    return s_config;
}

bool loadConfig() {
    s_prefs.begin("bowcam", true); // read-only

    String ssid = s_prefs.getString("wifi_ssid", "");
    if (ssid.length() == 0) {
        s_prefs.end();
        LOG_INFO("No WiFi config in NVS — will start AP mode");
        return false;
    }

    strncpy(s_config.wifi_ssid, ssid.c_str(), sizeof(s_config.wifi_ssid) - 1);
    strncpy(s_config.wifi_pass, s_prefs.getString("wifi_pass", "").c_str(), sizeof(s_config.wifi_pass) - 1);
    strncpy(s_config.mqtt_host, s_prefs.getString("mqtt_host", DEFAULT_MQTT_HOST).c_str(), sizeof(s_config.mqtt_host) - 1);
    s_config.mqtt_port = s_prefs.getUShort("mqtt_port", DEFAULT_MQTT_PORT);
    strncpy(s_config.mqtt_user, s_prefs.getString("mqtt_user", "").c_str(), sizeof(s_config.mqtt_user) - 1);
    strncpy(s_config.mqtt_pass, s_prefs.getString("mqtt_pass", "").c_str(), sizeof(s_config.mqtt_pass) - 1);
    strncpy(s_config.camera_id, s_prefs.getString("camera_id", DEFAULT_CAMERA_ID).c_str(), sizeof(s_config.camera_id) - 1);
    strncpy(s_config.camera_mode, s_prefs.getString("camera_mode", DEFAULT_CAMERA_MODE).c_str(), sizeof(s_config.camera_mode) - 1);
    s_config.lane_ids[0] = s_prefs.getInt("lane1", 5);
    s_config.lane_ids[1] = s_prefs.getInt("lane2", 6);
    s_config.lane_count = (strcmp(s_config.camera_mode, "single") == 0) ? 1 : 2;

    s_prefs.end();
    LOG_INFO("Config loaded: SSID=%s, cam_id=%s, mode=%s, lanes=%d/%d",
             s_config.wifi_ssid, s_config.camera_id, s_config.camera_mode,
             s_config.lane_ids[0], s_config.lane_ids[1]);
    return true;
}

void saveConfig(const Config& cfg) {
    s_prefs.begin("bowcam", false); // read-write

    s_prefs.putString("wifi_ssid", cfg.wifi_ssid);
    s_prefs.putString("wifi_pass", cfg.wifi_pass);
    s_prefs.putString("mqtt_host", cfg.mqtt_host);
    s_prefs.putUShort("mqtt_port", cfg.mqtt_port);
    s_prefs.putString("mqtt_user", cfg.mqtt_user);
    s_prefs.putString("mqtt_pass", cfg.mqtt_pass);
    s_prefs.putString("camera_id", cfg.camera_id);
    s_prefs.putString("camera_mode", cfg.camera_mode);
    s_prefs.putInt("lane1", cfg.lane_ids[0]);
    s_prefs.putInt("lane2", cfg.lane_ids[1]);

    s_prefs.end();
    LOG_INFO("Config saved to NVS");
}

bool connect() {
    if (strlen(s_config.wifi_ssid) == 0) {
        return false;
    }

    LOG_INFO("Connecting to WiFi: %s", s_config.wifi_ssid);
    WiFi.mode(WIFI_STA);
    WiFi.begin(s_config.wifi_ssid, s_config.wifi_pass);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - start) < WIFI_CONNECT_TIMEOUT_MS) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        LOG_INFO("WiFi connected: %s, IP: %s", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
        s_reconnect_backoff = 1000;
        return true;
    }

    LOG_WARN("WiFi connection timeout after %d ms", WIFI_CONNECT_TIMEOUT_MS);
    return false;
}

void startAP() {
    s_ap_mode = true;
    String mac = getMACSuffix();
    String ap_ssid = String(AP_SSID_PREFIX) + mac;

    LOG_INFO("Starting AP: SSID=%s, IP=192.168.4.1", ap_ssid.c_str());

    WiFi.mode(WIFI_AP);
    WiFi.softAP(ap_ssid.c_str(), AP_PASSWORD);
    delay(100);

    // DNS server for captive portal
    s_dns_server = new DNSServer();
    s_dns_server->start(53, "*", WiFi.softAPIP());

    // Web server
    s_web_server = new WebServer(80);

    s_web_server->on("/", HTTP_GET, []() {
        s_web_server->send(200, "text/html", PORTAL_HTML);
    });

    s_web_server->on("/save", HTTP_POST, []() {
        // Parse form data
        Config new_cfg = s_config;

        if (s_web_server->hasArg("wifi_ssid"))
            strncpy(new_cfg.wifi_ssid, s_web_server->arg("wifi_ssid").c_str(), sizeof(new_cfg.wifi_ssid) - 1);
        if (s_web_server->hasArg("wifi_pass"))
            strncpy(new_cfg.wifi_pass, s_web_server->arg("wifi_pass").c_str(), sizeof(new_cfg.wifi_pass) - 1);
        if (s_web_server->hasArg("mqtt_host"))
            strncpy(new_cfg.mqtt_host, s_web_server->arg("mqtt_host").c_str(), sizeof(new_cfg.mqtt_host) - 1);
        if (s_web_server->hasArg("mqtt_port"))
            new_cfg.mqtt_port = s_web_server->arg("mqtt_port").toInt();
        if (s_web_server->hasArg("mqtt_user"))
            strncpy(new_cfg.mqtt_user, s_web_server->arg("mqtt_user").c_str(), sizeof(new_cfg.mqtt_user) - 1);
        if (s_web_server->hasArg("mqtt_pass"))
            strncpy(new_cfg.mqtt_pass, s_web_server->arg("mqtt_pass").c_str(), sizeof(new_cfg.mqtt_pass) - 1);
        if (s_web_server->hasArg("camera_id"))
            strncpy(new_cfg.camera_id, s_web_server->arg("camera_id").c_str(), sizeof(new_cfg.camera_id) - 1);
        if (s_web_server->hasArg("camera_mode"))
            strncpy(new_cfg.camera_mode, s_web_server->arg("camera_mode").c_str(), sizeof(new_cfg.camera_mode) - 1);
        if (s_web_server->hasArg("lane1"))
            new_cfg.lane_ids[0] = s_web_server->arg("lane1").toInt();
        if (s_web_server->hasArg("lane2"))
            new_cfg.lane_ids[1] = s_web_server->arg("lane2").toInt();
        new_cfg.lane_count = (strcmp(new_cfg.camera_mode, "single") == 0) ? 1 : 2;

        saveConfig(new_cfg);

        s_web_server->send(200, "text/html",
            "<html><body style='text-align:center;padding:40px;font-family:sans-serif'>"
            "<h1>✅ Saved!</h1><p>Camera will reboot in 3 seconds...</p></body></html>");

        delay(3000);
        ESP.restart();
    });

    // Catch-all for captive portal redirect
    s_web_server->onNotFound([]() {
        s_web_server->sendHeader("Location", "http://192.168.4.1/");
        s_web_server->send(302, "text/plain", "");
    });

    s_web_server->begin();
    LOG_INFO("Captive portal ready at http://192.168.4.1/");
}

void processAP() {
    if (!s_ap_mode) return;
    if (s_dns_server) s_dns_server->processNextRequest();
    if (s_web_server) s_web_server->handleClient();
}

bool isConnected() {
    return (WiFi.status() == WL_CONNECTED);
}

int getRSSI() {
    return WiFi.RSSI();
}

String getIP() {
    return WiFi.localIP().toString();
}

String getMACSuffix() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char buf[8];
    snprintf(buf, sizeof(buf), "%02X%02X", mac[4], mac[5]);
    return String(buf);
}

bool reconnect() {
    unsigned long now = millis();
    if (now - s_last_reconnect_attempt < s_reconnect_backoff) {
        return false;
    }
    s_last_reconnect_attempt = now;

    LOG_WARN("WiFi reconnect attempt (backoff: %lu ms)", s_reconnect_backoff);
    WiFi.disconnect();
    WiFi.begin(s_config.wifi_ssid, s_config.wifi_pass);

    // Increase backoff
    s_reconnect_backoff = min(s_reconnect_backoff * 2, (unsigned long)MAX_RECONNECT_BACKOFF);

    return (WiFi.status() == WL_CONNECTED);
}

bool isAPMode() {
    return s_ap_mode;
}

} // namespace wifi_manager
