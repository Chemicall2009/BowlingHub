/**
 * @file src/mocks/handlers/logs.ts
 * @description MSW v2 эндпоинты для логов (команды, трафик, ошибки) с пагинацией и экспортом.
 */

import { http, HttpResponse, delay } from "msw";
import type { LogPage } from "../../api/logs";

// Генерируем мок-данные в памяти при инициализации
let mockCommands = Array.from({ length: 500 }, (_, i) => ({
  id: `cmd_${i}`,
  timestamp: new Date(Date.now() - i * 360000).toISOString(),
  direction: i % 2 === 0 ? "tx" : "rx",
  lane_id: (i % 12) + 1,
  cmd: (i % 5) + 1,
  cmd_name: i % 5 === 0 ? "RESET_LANE" : i % 5 === 1 ? "POLL_STATUS" : "STATUS_OK",
  dry_run: i % 3 === 0,
  raw_hex: "02 01 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 A4",
  checksum_ok: true,
  duration_ms: Math.floor(Math.random() * 30) + 5,
  error: null,
}));

let mockTraffic = Array.from({ length: 1500 }, (_, i) => ({
  id: `traf_${i}`,
  timestamp: new Date(Date.now() - i * 120000).toISOString(),
  direction: i % 2 === 0 ? "rx" : "tx",
  lane_id: (i % 24) + 1,
  cmd: 2,
  cmd_name: "POLL_STATUS",
  raw_hex: "02 01 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 A4",
  checksum_ok: i % 30 !== 0,
  baud: 9600,
  parse_error: i % 30 !== 0 ? null : "CRC checksum mismatch",
}));

let mockErrors = Array.from({ length: 150 }, (_, i) => ({
  id: `err_${i}`,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  lane_id: (i % 12) + 1,
  cmd: 1,
  cmd_name: "RESET_LANE",
  error_code: "ERR_TIMEOUT",
  message: `Таймаут ответа от пинсеттера на дорожке #${(i % 12) + 1}`,
  checksum_ok: false,
}));

export const logsHandlers = [
  // GET /api/logs
  http.get("/api/logs", async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const source = url.searchParams.get("source") || "commands";
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const search = url.searchParams.get("search")?.toLowerCase() || "";
    const laneIdParam = url.searchParams.get("lane_id");
    const cmdParam = url.searchParams.get("cmd");
    const dirParam = url.searchParams.get("direction");
    const onlyErrors = url.searchParams.get("only_errors") === "true";

    let dataset: any[] = [];
    if (source === "commands") dataset = mockCommands;
    else if (source === "traffic") dataset = mockTraffic;
    else if (source === "errors") dataset = mockErrors;

    const filtered = dataset.filter((item) => {
      if (laneIdParam && laneIdParam !== "all" && item.lane_id !== parseInt(laneIdParam, 10)) {
        return false;
      }
      if (cmdParam && cmdParam !== "all" && item.cmd !== parseInt(cmdParam, 10)) {
        return false;
      }
      if (dirParam && dirParam !== "all" && item.direction && item.direction !== dirParam) {
        return false;
      }
      if (onlyErrors && item.checksum_ok !== false && !item.parse_error && !item.error_code) {
        return false;
      }
      if (search) {
        const joined = JSON.stringify(item).toLowerCase();
        if (!joined.includes(search)) return false;
      }
      return true;
    });

    const paginated = filtered.slice(offset, offset + limit);

    const page: LogPage<any> = {
      items: paginated,
      total: filtered.length,
      limit,
      offset,
    };

    return HttpResponse.json(page);
  }),

  // DELETE /api/logs
  http.delete("/api/logs", async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const source = url.searchParams.get("source");

    if (source === "commands") mockCommands = [];
    else if (source === "traffic") mockTraffic = [];
    else if (source === "errors") mockErrors = [];

    return HttpResponse.json({ success: true });
  }),

  // POST /api/logs/export
  http.post("/api/logs/export", async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const source = url.searchParams.get("source") || "commands";

    let dataset: any[] = [];
    if (source === "commands") dataset = mockCommands;
    else if (source === "traffic") dataset = mockTraffic;
    else if (source === "errors") dataset = mockErrors;

    const BOM = "\uFEFF";
    const csvHeader = "ID;Timestamp;Lane;Command;Details\n";
    const csvRows = dataset.slice(0, 1000).map((item) => {
      return `${item.id};${item.timestamp};${item.lane_id || "—"};${item.cmd_name || item.error_code || "—"};"${JSON.stringify(item).replace(/"/g, '""')}"`;
    }).join("\n");

    const csvContent = BOM + csvHeader + csvRows;

    return new HttpResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="${source}_logs.csv"`,
      },
    });
  }),
];
