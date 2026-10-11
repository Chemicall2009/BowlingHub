# Инструкция по развёртыванию TV-панелей (Kiosk Mode)

Данное руководство описывает настройку мини-ПК (например, Raspberry Pi 4 / Intel NUC) над дорожками боулинга для отображения актуального счёта в полноэкранном режиме (kiosk-режим) без элементов управления оператора.

---

## 1. Системные требования
- **ОС**: Ubuntu 22.04+ LTS (или Raspberry Pi OS Bookworm)
- **Браузер**: Chromium (последняя версия)
- **Сеть**: Доступ к бэкенду боулинг-центра по сети (например, `http://192.168.1.100:8000`)

---

## 2. Установка зависимостей
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install chromium-browser unclutter xdotool -y
```

---

## 3. Настройка автозапуска (Systemd User Service)

Создайте системный сервис для автозапуска Chromium в режиме киоска при стартовке графической сессии мини-ПК.

Файл: `~/.config/systemd/user/bowling-kiosk.service`

```ini
[Unit]
Description=Bowling TV Kiosk Display
After=graphical-session.target

[Service]
Environment=DISPLAY=:0
ExecStart=/usr/bin/chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-translate \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --disable-session-crashed-bubble \
  http://192.168.1.100:8000/tv/6

[Install]
WantedBy=graphical-session.target
```
*(Замените `192.168.1.100:8000` на адрес вашего сервера, а `/tv/6` на номер дорожки, над которой установлен данный мини-ПК).*

### Активация сервиса:
```bash
systemctl --user daemon-reload
systemctl --user enable bowling-kiosk.service
systemctl --user start bowling-kiosk.service
```

---

## 4. Отключение скринсейвера и спящего режима (X11 / LightDM)

Отредактируйте файл `~/.xprofile` или автозапуск рабочего стола:
```bash
xset s off
xset -dpms
xset s noblank
unclutter -idle 3 & # Скрытие курсора мыши через 3 секунды бездействия
```

---

## 5. Проверка работы
1. Перейдите по адресу `http://<server-ip>:8000/tv/<lane_id>` с любого устройства.
2. Убедитесь, что отображается полноэкранное табло, пины, текущий игрок и счёт.
3. При отсутствии игры отображается статус «Свободна» (TvIdle), при обрыве связи — оффлайн-плашка.
