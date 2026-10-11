/**
 * @file src/api/logs.ts
 * @description API-клиент и типы для логов (команды, трафик, ошибки).
 */

import { apiClient } from "./client";
import type { SnifferFrame } from "./sniffer";

export type LogSource = "commands" | "traffic" | "errors";

export type LogQuery = {
  source: LogSource;
  from?: string;
  to?: string;
  lane_id?: number | "all";
  cmd?: number | "all";
  direction?: "rx" | "tx" | "all";
  only_errors?: boolean;
  search?: string;
  limit: number;
  offset: number;
};

export type LogPage<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export async function getLogs<T = any>(query: LogQuery): Promise<LogPage<T>> {
  const params = new URLSearchParams();
  params.set("source", query.source);
  params.set("limit", query.limit.toString());
  params.set("offset", query.offset.toString());
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.lane_id && query.lane_id !== "all") params.set("lane_id", query.lane_id.toString());
  if (query.cmd && query.cmd !== "all") params.set("cmd", query.cmd.toString());
  if (query.direction && query.direction !== "all") params.set("direction", query.direction);
  if (query.only_errors) params.set("only_errors", "true");
  if (query.search) params.set("search", query.search);

  return apiClient<LogPage<T>>(`/logs?${params.toString()}`);
}

export async function deleteLogs(source: LogSource): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/logs?source=${source}`, {
    method: "DELETE",
  });
}

export async function exportLogsBlob(query: Omit<LogQuery, "limit" | "offset">): Promise<Blob> {
  const params = new URLSearchParams();
  params.set("source", query.source);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.lane_id && query.lane_id !== "all") params.set("lane_id", query.lane_id.toString());
  if (query.cmd && query.cmd !== "all") params.set("cmd", query.cmd.toString());
  if (query.direction && query.direction !== "all") params.set("direction", query.direction);
  if (query.only_errors) params.set("only_errors", "true");
  if (query.search) params.set("search", query.search);

  const res = await fetch(`/api/logs/export?${params.toString()}`, {
    method: "POST",
  });
  return res.blob();
}
