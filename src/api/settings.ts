/**
 * @file src/api/settings.ts
 * @description API-клиент для настроек оборудования и протокола.
 */

import { apiClient } from "./client";
import type { Settings } from "./types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";
import { toast } from "sonner";
import { useOperationMode, type OperationMode } from "../stores/operationMode";

export type { OperationMode };

export type ModeInfo = {
  mode: OperationMode;
  available_modes: OperationMode[];
  can_switch_to: {
    emulation: boolean;
    combat: boolean;
  };
};

export type ModeSwitchDto = {
  mode: OperationMode;
  confirm_token: string;
};

export function useOperationModeInfo() {
  return useQuery({
    queryKey: ["settings", "mode"],
    queryFn: () => apiGet<ModeInfo>("/settings/mode"),
  });
}

export function useSwitchOperationMode() {
  const qc = useQueryClient();
  const setLocalMode = useOperationMode((s) => s.setMode);
  return useMutation({
    mutationFn: (dto: ModeSwitchDto) =>
      apiPost<ModeInfo>("/settings/mode", dto),
    onSuccess: (data) => {
      setLocalMode(data.mode);
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["lanes"] });
      qc.invalidateQueries({ queryKey: ["cameras"] });
      toast.success(`Режим: ${data.mode === "combat" ? "Боевой" : "Эмуляция"}`);
    },
    onError: (err) => {
      toast.error(`Не удалось переключить режим: ${err}`);
    },
  });
}

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
