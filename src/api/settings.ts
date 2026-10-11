/**
 * @file src/api/settings.ts
 * @description API-клиент для настроек оборудования и протокола.
 */

import { apiClient } from "./client";
import type { Settings } from "./types";

export async function getSettings(): Promise<Settings> {
  return apiClient<Settings>("/settings");
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  return apiClient<Settings>("/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function testConnection(params: {
  transport: string;
  serial_port?: string | null;
  serial_baud?: number;
  tcp_host?: string | null;
  tcp_port?: number | null;
}): Promise<{ ok: boolean; message: string; latency_ms: number }> {
  return apiClient<{ ok: boolean; message: string; latency_ms: number }>("/settings/test-connection", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function testNotification(webhookUrl?: string | null): Promise<{ ok: boolean }> {
  return apiClient<{ ok: boolean }>("/settings/test-notification", {
    method: "POST",
    body: JSON.stringify({ webhook_url: webhookUrl }),
  });
}

export async function resetSettings(): Promise<Settings> {
  return apiClient<Settings>("/settings/reset", {
    method: "POST",
  });
}
