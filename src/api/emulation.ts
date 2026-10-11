/**
 * @file src/api/emulation.ts
 * @description React Query хуки для взаимодействия с API симулятора дорожек.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "./client";
import { toast } from "sonner";
import type { SimConfig } from "../mocks/simulation/types";

export type EmulationStatus = {
  active_lanes: number[];
  config: SimConfig;
};

export function useEmulationStatus() {
  return useQuery({
    queryKey: ["emulation", "status"],
    queryFn: () => apiGet<EmulationStatus>("/emulation/status"),
    refetchInterval: 2000,
  });
}

export function useStartEmulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lane_ids?: number[]) =>
      apiPost<{ started: number[] }>("/emulation/start", { lane_ids }),
    onSuccess: (_, lane_ids) => {
      qc.invalidateQueries({ queryKey: ["emulation"] });
      qc.invalidateQueries({ queryKey: ["lanes"] });
      toast.success(
        lane_ids && lane_ids.length > 0
          ? `Симуляция запущена на дорожках ${lane_ids.join(", ")}`
          : "Симуляция запущена на всех дорожках"
      );
    },
  });
}

export function useStopEmulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lane_ids?: number[]) =>
      apiPost<{ stopped: number[] }>("/emulation/stop", { lane_ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emulation"] });
      toast.success("Симуляция остановлена");
    },
  });
}

export function usePauseEmulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lane_ids?: number[]) =>
      apiPost<{ paused: number[] }>("/emulation/pause", { lane_ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emulation"] }),
  });
}

export function useResumeEmulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lane_ids?: number[]) =>
      apiPost<{ resumed: number[] }>("/emulation/resume", { lane_ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emulation"] }),
  });
}

export function useThrowNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lane_id: number) =>
      apiPost<{ thrown: boolean; lane_id: number }>("/emulation/throw", { lane_id }),
    onSuccess: (_, lane_id) => {
      qc.invalidateQueries({ queryKey: ["lane", lane_id] });
      qc.invalidateQueries({ queryKey: ["lanes"] });
      qc.invalidateQueries({ queryKey: ["tv", "lane", lane_id] });
      toast.success(`Бросок на дорожке #${lane_id} сгенерирован`);
    },
  });
}

export function useEmulationConfig() {
  return useQuery({
    queryKey: ["emulation", "config"],
    queryFn: () => apiGet<SimConfig>("/emulation/config"),
  });
}

export function useUpdateEmulationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<SimConfig>) =>
      apiPut<SimConfig>("/emulation/config", config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emulation"] });
      toast.success("Параметры симуляции обновлены");
    },
  });
}
