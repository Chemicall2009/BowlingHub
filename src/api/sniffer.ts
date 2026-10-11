/**
 * @file src/api/sniffer.ts
 * @description Типы, функции фильтрации, статистики и API-клиент для сниффера LCom.
 */

import { apiClient } from "./client";
import type { ParsedFrame } from "../lib/lcom";

export type SnifferFrame = {
  id: string;
  direction: "rx" | "tx";
  timestamp: string;
  raw_hex: string;
  parsed: ParsedFrame | null;
  parse_error: string | null;
  baud: number;
};

export type SnifferStatus = {
  transport: "serial" | "tcp" | "mock";
  endpoint: string;
  baud: number;
  status: "online" | "degraded" | "offline";
  dropped_frames: number;
  total_frames: number;
  connected_at: string;
};

export type SnifferError = {
  timestamp: string;
  code: string;
  message: string;
  lane_id: number | null;
};

export type FrameFilter = {
  direction: "all" | "rx" | "tx";
  lane_id: number | "all";
  cmd: number | "all";
  only_errors: boolean;
  only_checksum_bad: boolean;
  search: string;
};

export type SnifferStats = {
  total: number;
  ok: number;
  errors: number;
  checksum_bad: number;
  by_lane: Record<number, number>;
  by_cmd: Record<number, number>;
  avg_interval_ms: number;
};

/**
 * Получение текущего статуса сниффера с бэкенда/MSW.
 */
export async function getSnifferStatus(): Promise<SnifferStatus> {
  return apiClient<SnifferStatus>("/sniffer/status");
}

/**
 * Запуск сниффера.
 */
export async function startSniffer(): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/sniffer/start", { method: "POST" });
}

/**
 * Останока сниффера.
 */
export async function stopSniffer(): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/sniffer/stop", { method: "POST" });
}

/**
 * Получение последних кадров из кольцевого буфера сервера.
 */
export async function getRecentFrames(limit = 100): Promise<SnifferFrame[]> {
  return apiClient<SnifferFrame[]>(`/sniffer/recent?limit=${limit}`);
}

/**
 * Вычисляет статистику по массиву кадров.
 */
export function computeStats(frames: SnifferFrame[]): SnifferStats {
  const by_lane: Record<number, number> = {};
  const by_cmd: Record<number, number> = {};
  let ok = 0;
  let errors = 0;
  let checksum_bad = 0;

  for (const f of frames) {
    if (f.parse_error) {
      errors++;
    }
    if (f.parsed) {
      if (f.parsed.checksumOk) {
        ok++;
      } else {
        checksum_bad++;
      }
      const lane = f.parsed.laneId;
      by_lane[lane] = (by_lane[lane] || 0) + 1;

      const cmd = f.parsed.cmd;
      by_cmd[cmd] = (by_cmd[cmd] || 0) + 1;
    } else {
      errors++;
      checksum_bad++;
    }
  }

  let avg_interval_ms = 0;
  if (frames.length > 1) {
    try {
      const first = new Date(frames[frames.length - 1].timestamp).getTime();
      const last = new Date(frames[0].timestamp).getTime();
      const diff = Math.abs(last - first);
      avg_interval_ms = Math.round(diff / frames.length);
    } catch {
      avg_interval_ms = 150;
    }
  } else {
    avg_interval_ms = 150;
  }

  return {
    total: frames.length,
    ok,
    errors,
    checksum_bad,
    by_lane,
    by_cmd,
    avg_interval_ms,
  };
}

/**
 * Применяет фильтры к массиву кадров.
 */
export function applyFilter(frames: SnifferFrame[], f: FrameFilter): SnifferFrame[] {
  return frames.filter((frame) => {
    if (f.direction !== "all" && frame.direction !== f.direction) {
      return false;
    }

    if (f.lane_id !== "all") {
      const frameLane = frame.parsed?.laneId ?? null;
      if (frameLane !== f.lane_id) {
        return false;
      }
    }

    if (f.cmd !== "all") {
      const frameCmd = frame.parsed?.cmd ?? null;
      if (frameCmd !== f.cmd) {
        return false;
      }
    }

    if (f.only_errors && !frame.parse_error) {
      return false;
    }

    if (f.only_checksum_bad && frame.parsed?.checksumOk !== false) {
      return false;
    }

    if (f.search.trim() !== "") {
      const query = f.search.trim().toUpperCase();
      const cleanHex = frame.raw_hex.replace(/\s+/g, "");
      if (!cleanHex.includes(query.replace(/\s+/g, ""))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Экспортирует кадры в CSV с BOM (для Excel) и разделителем точка с запятой.
 */
export function exportToCsv(frames: SnifferFrame[]): string {
  const BOM = "\uFEFF";
  const headers = ["Timestamp;Direction;Lane;Command;ChecksumOK;Baud;RawHex;Error"];
  const rows = frames.map((f) => {
    const ts = f.timestamp;
    const dir = f.direction.toUpperCase();
    const lane = f.parsed?.laneId ?? "—";
    const cmd = f.parsed?.cmdName ?? "UNKNOWN";
    const crc = f.parsed?.checksumOk ? "OK" : "BAD";
    const baud = f.baud;
    const hex = f.raw_hex;
    const err = f.parse_error ? `"${f.parse_error.replace(/"/g, '""')}"` : "";
    return `${ts};${dir};${lane};${cmd};${crc};${baud};"${hex}";${err}`;
  });

  return BOM + [headers, ...rows].join("\n");
}
