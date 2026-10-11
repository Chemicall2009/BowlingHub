#!/usr/bin/env bash
# fix-firmware-camera.sh
# Приводит firmware_camera к сборке под ArduinoJson 6.x + ESP-IDF 4.4.
# Идемпотентный: запускай после каждой регенерации AI Studio.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../firmware/firmware_camera"
echo "fix-firmware-camera.sh — $(pwd)"

FIXED=0

# 1. platformio.ini — ArduinoJson 6.x
if grep -q 'ArduinoJson@\^7' platformio.ini 2>/dev/null; then
  sed -i 's|ArduinoJson@\^7\.0\.0|ArduinoJson@^6.21.5|' platformio.ini
  echo "  platformio.ini: ArduinoJson 7 → 6"
  FIXED=$((FIXED+1))
fi

# 2. config.h — MQTT_MAX_PACKET_SIZE/BUFFER_SIZE
if grep -q '^#define MQTT_MAX_PACKET_SIZE    131072' src/config.h 2>/dev/null; then
  sed -i 's|^#define MQTT_MAX_PACKET_SIZE.*|#undef MQTT_MAX_PACKET_SIZE\n#define MQTT_MAX_PACKET_SIZE    65535|' src/config.h
  sed -i 's|^#define MQTT_BUFFER_SIZE.*|#undef MQTT_BUFFER_SIZE\n#define MQTT_BUFFER_SIZE        65535|' src/config.h
  echo "  config.h: MQTT буферы → 65535"
  FIXED=$((FIXED+1))
fi

# 3. main.cpp — JsonDocument, include ArduinoJson
if grep -q '\bJsonDocument doc;' src/main.cpp 2>/dev/null; then
  sed -i 's/\bJsonDocument doc;/StaticJsonDocument<512> doc;/g' src/main.cpp
  echo "  main.cpp: JsonDocument → StaticJsonDocument"
  FIXED=$((FIXED+1))
fi
if ! grep -q '#include <ArduinoJson.h>' src/main.cpp 2>/dev/null; then
  sed -i 's|#include <esp_system.h>|#include <esp_system.h>\n#include <ArduinoJson.h>|' src/main.cpp
  echo "  main.cpp: + #include <ArduinoJson.h>"
  FIXED=$((FIXED+1))
fi

# 4. main.cpp — esp_task_wdt_init под IDF 4.4
if grep -q 'esp_task_wdt_config_t' src/main.cpp 2>/dev/null; then
  python3 - <<'PYEOF'
import re
p = "src/main.cpp"
s = open(p).read()
s = re.sub(r"esp_task_wdt_config_t\s+\w+\s*=\s*\{[^;]*?\};", "", s, flags=re.DOTALL)
s = re.sub(r"esp_task_wdt_init\s*\(\s*&\w+\s*\)", "esp_task_wdt_init(WDT_TIMEOUT_S, true)", s)
open(p, "w").write(s)
PYEOF
  echo "  main.cpp: esp_task_wdt API → IDF 4.4"
  FIXED=$((FIXED+1))
fi

# 5. mqtt_client.cpp — namespace + константы
if grep -q '^static MessageCallback s_callback' src/mqtt_client.cpp 2>/dev/null; then
  sed -i 's/static MessageCallback s_callback/static mqtt_client::MessageCallback s_callback/' src/mqtt_client.cpp
  echo "  mqtt_client.cpp: MessageCallback namespace"
  FIXED=$((FIXED+1))
fi
sed -i 's/\bMQTT_CONNECT_TIMEOUT\b/MQTT_CONNECTION_TIMEOUT/g; s/\bMQTT_UNAUTHORIZED\b/MQTT_CONNECT_UNAUTHORIZED/g' src/mqtt_client.cpp

# 6. wifi_manager.cpp — Config namespace
if grep -q '^static Config s_config;' src/wifi_manager.cpp 2>/dev/null; then
  sed -i 's/^static Config s_config;/static wifi_manager::Config s_config;/' src/wifi_manager.cpp
  echo "  wifi_manager.cpp: Config namespace"
  FIXED=$((FIXED+1))
fi

# 7. command_handler.cpp — JsonDocument
sed -i 's/\bJsonDocument doc;/StaticJsonDocument<512> doc;/g' src/command_handler.cpp 2>/dev/null || true
sed -i 's/static JsonDocument s_pending_cmd;/static StaticJsonDocument<512> s_pending_cmd;/' src/command_handler.cpp 2>/dev/null || true

# 8. status_reporter.cpp — JsonDocument + WiFi
sed -i 's/\bJsonDocument doc;/StaticJsonDocument<1024> doc;/g' src/status_reporter.cpp 2>/dev/null || true
if ! grep -q '#include <WiFi.h>' src/status_reporter.cpp 2>/dev/null; then
  sed -i 's|#include <ArduinoJson.h>|#include <ArduinoJson.h>\n#include <WiFi.h>|' src/status_reporter.cpp
  echo "  status_reporter.cpp: + #include <WiFi.h>"
  FIXED=$((FIXED+1))
fi

echo "Применено правок: $FIXED"
if [[ $FIXED -gt 0 ]]; then
  echo "Пересобрать: cd firmware/firmware_camera && rm -rf .pio && pio run"
else
  echo "Всё уже в правильном состоянии."
fi
