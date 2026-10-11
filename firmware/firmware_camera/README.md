# 🎳 Bowling Camera Firmware — ESP32-CAM AI-Thinker

Прошивка для модуля камеры системы калибровки кеглей боулинга.
Камера смотрит на 2 пиндека дорожек (например, 5 и 6) с расстояния ~2 метра
и передаёт снимки через MQTT для последующей обработки backend'ом.

## Особенности

- **Независимый цифровой канал** — работает без штатного LCom (RS-485)
- **MQTT-based** — все команды и данные через MQTT брокер
- **Captive Portal** — настройка через WiFi при первом запуске
- **Streaming publish** — JPEG публикуется чанками без буферизации в heap
- **Watchdog** — автоматический перезапуск при зависании
- **LWT** — Last Will and Testament для детектирования offline

## Аппаратные требования

- ESP32-CAM AI-Thinker (OV2640)
- PSRAM 4MB (обязательно для буферов камеры)
- Питание 5V / 2A минимум
- WiFi 2.4 GHz

## Сборка

```bash
# Установить PlatformIO CLI
pip install platformio

# Собрать прошивку
cd firmware_camera
pio run

# Загрузить на плату
pio run --target upload

# Монитор Serial
pio device monitor --baud 115200
```

## Первоначальная настройка

1. При первом включении (или если NVS пуст) камера поднимает WiFi AP:
   - SSID: `BowlingCam-XXXXXXXX` (MAC-адрес)
   - Пароль: `configure123`
2. Подключиться к AP, откроется captive portal
3. Заполнить форму:
   - WiFi SSID и пароль
   - MQTT хост и порт
   - Camera ID (уникальный)
   - Режим (dual/single)
   - Номера обслуживаемых дорожек
4. Нажать "Save & Reboot"

## MQTT Протокол

### Топики

| Топик | Направление | QoS | Retained | Формат |
|-------|------------|-----|----------|--------|
| `camera/{id}/status` | cam → hub | 0 | ✓ | JSON |
| `camera/{id}/cmd` | hub → cam | 1 | ✗ | JSON |
| `camera/{id}/result` | cam → hub | 1 | ✗ | JSON |
| `camera/{id}/snapshot` | cam → hub | 1 | ✗ | raw JPEG |
| `camera/{id}/events` | cam → hub | 0 | ✗ | JSON |

### Команды (cmd)

```json
// Снимок
{"action": "snapshot", "request_id": "req-001", "lane_id": 5}

// Пинг
{"action": "ping", "request_id": "req-002"}

// Перезагрузка
{"action": "reboot", "request_id": "req-003"}

// Изменить качество
{"action": "set_quality", "request_id": "req-004", "value": 15}

// Изменить разрешение
{"action": "set_framesize", "request_id": "req-005", "value": "XGA"}
```

### Статус (status)

```json
{
  "camera_id": "cam-01",
  "version": "1.0.0",
  "uptime_sec": 3721,
  "wifi_rssi": -58,
  "wifi_ssid": "MyNetwork",
  "ip": "192.168.2.42",
  "mqtt_connected": true,
  "free_heap": 145632,
  "psram_free": 3145728,
  "lane_ids": [5, 6],
  "mode": "dual",
  "last_snapshot_at": "uptime:1234s",
  "snapshots_total": 128,
  "errors_total": 0,
  "reset_reason": "power_on"
}
```

## Структура проекта

```
firmware_camera/
├── platformio.ini          # Конфигурация сборки
├── src/
│   ├── main.cpp            # Точка входа, setup/loop
│   ├── config.h            # Все параметры с дефолтами
│   ├── camera.h/.cpp       # OV2640 инициализация, захват JPEG
│   ├── wifi_manager.h/.cpp # WiFi + captive portal
│   ├── mqtt_client.h/.cpp  # PubSubClient wrapper
│   ├── mqtt_topics.h       # Константы топиков
│   ├── command_handler.h/.cpp  # Обработка команд
│   ├── status_reporter.h/.cpp  # Heartbeat статус
│   └── logging.h           # Макросы логирования
└── README.md               # Этот файл
```

## Потребление памяти

- Flash: ~1.2 MB
- Heap (рабочий): ~80 KB
- PSRAM: ~3 MB (framebuffers камеры)
- Размер JPEG (SVGA, q=12): ~40-80 KB

## Оптимизации для подсчёта кеглей

- `CAMERA_GRAB_LATEST` — всегда берём самый свежий кадр
- 2 framebuffer в PSRAM — не блокируем поток
- JPEG quality 12 — баланс качества и размера
- SVGA (800x600) — достаточно для детекции кеглей на 2м
- AWB/AEC включены — адаптация к освещению дорожки

## Отладка

```bash
# Serial monitor
pio device monitor

# Очистить NVS (сброс настроек)
pio run --target erase

# Посмотреть размер прошивки
pio run --target size
```

## Лицензия

MIT — свободное использование в системах калибровки боулинга.
