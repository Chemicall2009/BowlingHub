/**
 * @file src/mocks/handlers/sniffer.ts
 * @description MSW v2 эндпоинты для управления сниффером LCom.
 */

import { http, HttpResponse } from "msw";
import type { SnifferStatus, SnifferFrame } from "../../api/sniffer";

let isRunning = true;
let totalFramesCounter = 1420;
let droppedFramesCounter = 3;

export const snifferHandlers = [
  // GET /api/sniffer/status
  http.get("/api/sniffer/status", () => {
    const status: SnifferStatus = {
      transport: "mock",
      endpoint: "mock://sniffer/rs485",
      baud: 9600,
      status: isRunning ? "online" : "offline",
      dropped_frames: droppedFramesCounter,
      total_frames: totalFramesCounter,
      connected_at: new Date(Date.now() - 3600000).toISOString(),
    };
    return HttpResponse.json(status);
  }),

  // POST /api/sniffer/start
  http.post("/api/sniffer/start", () => {
    isRunning = true;
    return HttpResponse.json({ success: true });
  }),

  // POST /api/sniffer/stop
  http.post("/api/sniffer/stop", () => {
    isRunning = false;
    return HttpResponse.json({ success: true });
  }),

  // GET /api/sniffer/recent
  http.get("/api/sniffer/recent", ({ request }) => {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Генерируем тестовые недавние кадры для восстановления контекста
    const frames: SnifferFrame[] = [];
    for (let i = 0; i < Math.min(limit, 50); i++) {
      frames.push({
        id: `recent_${i}`,
        direction: i % 2 === 0 ? "rx" : "tx",
        timestamp: new Date(Date.now() - i * 500).toISOString(),
        raw_hex: "02 01 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 A4",
        parsed: {
          cmd: 2,
          cmdName: "POLL_STATUS",
          laneId: (i % 24) + 1,
          payload: new Uint8Array([85, 85, 85]),
          checksum: 164,
          checksumOk: true,
          raw: new Uint8Array([2, 1, 85, 85, 164]),
        },
        parse_error: null,
        baud: 9600,
      });
    }

    return HttpResponse.json(frames);
  }),
];
