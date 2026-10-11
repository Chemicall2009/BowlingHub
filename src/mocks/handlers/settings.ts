/**
 * @file src/mocks/handlers/settings.ts
 * @description MSW v2 обработчики эндпоинтов настроек оборудования и протокола.
 */

import { http, HttpResponse, delay } from "msw";
import type { Settings } from "../../api/types";
import type { ProblemDetails } from "./lanes";

let currentSettings: Settings = {
  transport: "serial",
  serial_port: "/dev/ttyUSB0",
  serial_baud: 9600,
  tcp_host: "192.168.4.1",
  tcp_port: 2323,
  xor_mask_hex: "00",
  checksum_variant: "sum256",
  frame_length: 30,
  lanes_count: 12,
  lanes_start_number: 1,
  poll_interval_ms: 15,
  poll_timeout_ms: 30,
  inter_packet_delay_ms: 15,
  auto_baud_switch: true,
  notifications: {
    on_lane_offline: true,
    on_checksum_error: true,
    on_connection_lost: true,
    sound_enabled: true,
    email_webhook: null,
  },
};

let currentMode: "emulation" | "combat" = "emulation";

async function randomNetworkDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * 120) + 80;
  await delay(ms);
}

export const settingsHandlers = [
  // GET /api/settings/mode
  http.get("/api/settings/mode", async () => {
    await randomNetworkDelay();
    return HttpResponse.json({
      mode: currentMode,
      available_modes: ["emulation", "combat"],
      can_switch_to: {
        emulation: currentMode === "combat",
        combat: currentMode === "emulation",
      },
    });
  }),

  // POST /api/settings/mode
  http.post("/api/settings/mode", async ({ request }) => {
    await randomNetworkDelay();
    const body = (await request.json()) as { mode: "emulation" | "combat"; confirm_token: string };
    if (body.confirm_token !== body.mode.toUpperCase()) {
      return HttpResponse.json(
        {
          type: "about:blank",
          title: "Invalid confirm token",
          status: 400,
          detail: `Ожидается ввод "${body.mode.toUpperCase()}"`,
        },
        { status: 400 }
      );
    }
    currentMode = body.mode;
    return HttpResponse.json({
      mode: currentMode,
      available_modes: ["emulation", "combat"],
      can_switch_to: {
        emulation: currentMode === "combat",
        combat: currentMode === "emulation",
      },
    });
  }),

  // GET /api/settings
  http.get("/api/settings", async () => {
    await randomNetworkDelay();
    return HttpResponse.json(currentSettings satisfies Settings);
  }),

  // PUT /api/settings
  http.put("/api/settings", async ({ request }) => {
    await randomNetworkDelay();

    let body: Partial<Settings>;
    try {
      body = (await request.json()) as Partial<Settings>;
    } catch {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/bad-request",
        title: "Некорректное тело запроса",
        status: 400,
        detail: "Ожидался JSON объект конфигурации",
        instance: "/api/settings",
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    if (body.lanes_count !== undefined && (body.lanes_count < 2 || body.lanes_count > 48)) {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/validation-failed",
        title: "Ошибка валидации параметров",
        status: 422,
        detail: "Количество дорожек должно быть в диапазоне от 2 до 48",
        instance: "/api/settings",
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 422,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    currentSettings = {
      ...currentSettings,
      ...body,
      notifications: {
        ...currentSettings.notifications,
        ...(body.notifications || {}),
      },
    };

    return HttpResponse.json(currentSettings satisfies Settings);
  }),

  // POST /api/settings/test-connection
  http.post("/api/settings/test-connection", async () => {
    await delay(600);
    const isSuccess = Math.random() > 0.3; // 70% success
    const latency = Math.floor(Math.random() * 45) + 8;

    if (isSuccess) {
      return HttpResponse.json({
        ok: true,
        message: `Успешное соединение с мостом LCom (задержка ${latency}ms)`,
        latency_ms: latency,
      });
    } else {
      return HttpResponse.json({
        ok: false,
        message: "Таймаут соединения с портом или мостом (нет ответа от RS-485)",
        latency_ms: 500,
      });
    }
  }),

  // POST /api/settings/test-notification
  http.post("/api/settings/test-notification", async () => {
    await delay(400);
    return HttpResponse.json({ ok: true });
  }),

  // POST /api/settings/reset
  http.post("/api/settings/reset", async () => {
    await delay(300);
    currentSettings = {
      transport: "serial",
      serial_port: "/dev/ttyUSB0",
      serial_baud: 9600,
      tcp_host: "192.168.4.1",
      tcp_port: 2323,
      xor_mask_hex: "00",
      checksum_variant: "sum256",
      frame_length: 30,
      lanes_count: 12,
      lanes_start_number: 1,
      poll_interval_ms: 15,
      poll_timeout_ms: 30,
      inter_packet_delay_ms: 15,
      auto_baud_switch: true,
      notifications: {
        on_lane_offline: true,
        on_checksum_error: true,
        on_connection_lost: true,
        sound_enabled: true,
        email_webhook: null,
      },
    };
    return HttpResponse.json(currentSettings satisfies Settings);
  }),
];
