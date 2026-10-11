/**
 * @file src/api/lanes.ts
 * @description React Query хуки для работы с дорожками боулинга.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, ApiError } from "./client";
import type { MockLane, MockShot } from "../mocks/data/lanes";
import type { LaneOptions, PinState } from "../lib/lcom";

/**
 * Получение списка всех дорожек (прямой async-вызов)
 */
export async function getLanes(): Promise<MockLane[]> {
  return apiGet<MockLane[]>("/lanes");
}

/**
 * Получение данных конкретной дорожки (прямой async-вызов)
 */
export async function getLaneById(id: number | string): Promise<MockLane> {
  return apiGet<MockLane>(`/lanes/${id}`);
}

/**
 * Сброс пинсеттера дорожки (прямой async-вызов)
 */
export async function resetLane(id: number | string): Promise<MockLane> {
  return apiPost<MockLane>(`/lanes/${id}/reset`);
}

/**
 * Обновление опций дорожки (тумблеры bambini, cosmic и др.)
 */
export async function updateLaneOptions(
  id: number | string,
  options: Partial<LaneOptions>
): Promise<MockLane> {
  return apiPost<MockLane>(`/lanes/${id}/options`, options);
}

/**
 * Установка состояния кеглей дорожки
 */
export async function updateLanePins(
  id: number | string,
  pins: boolean[]
): Promise<MockLane> {
  return apiPost<MockLane>(`/lanes/${id}/pins`, { pins });
}

/**
 * Добавление броска в историю дорожки
 */
export async function addShotToLane(
  id: number | string,
  shot: Partial<MockShot>
): Promise<MockLane> {
  return apiPost<MockLane>(`/lanes/${id}/shots`, shot);
}

/**
 * Опрос датчиков кеглей дорожки
 */
export async function pollLane(id: number | string): Promise<PinState> {
  return apiPost<PinState>(`/lanes/${id}/poll`);
}

/**
 * Получение списка всех дорожек клуба.
 */
export function useLanes() {
  return useQuery<MockLane[], ApiError>({
    queryKey: ["lanes"],
    queryFn: () => apiGet<MockLane[]>("/lanes"),
  });
}

/**
 * Получение данных конкретной дорожки по ID.
 */
export function useLane(id: number | string) {
  const numericId = Number(id);
  return useQuery<MockLane, ApiError>({
    queryKey: ["lane", numericId],
    queryFn: () => apiGet<MockLane>(`/lanes/${numericId}`),
    enabled: !isNaN(numericId) && numericId > 0,
  });
}

/**
 * Сброс пинсеттера дорожки в исходное состояние (все 10 кеглей).
 */
export function useResetLane() {
  const queryClient = useQueryClient();

  return useMutation<MockLane, ApiError, number>({
    mutationFn: (id: number) => apiPost<MockLane>(`/lanes/${id}/reset`),
    onSuccess: (updatedLane, id) => {
      // Обновляем кэш дорожки и общий список
      queryClient.setQueryData<MockLane>(["lane", id], updatedLane);
      queryClient.setQueryData<MockLane[]>(["lanes"], (old) => {
        if (!old) return [updatedLane];
        return old.map((l) => (l.id === id ? updatedLane : l));
      });
      queryClient.invalidateQueries({ queryKey: ["lanes"] });
      toast.success(`Пинсеттер дорожки ${updatedLane.number} сброшен`);
    },
    onError: (err) => {
      toast.error(err.problem?.detail || "Ошибка при сбросе дорожки");
    },
  });
}

/**
 * Оптимистичное обновление опций дорожки (тумблеры: bambini, cosmic и др.).
 */
export function useUpdateLaneOptions() {
  const queryClient = useQueryClient();

  return useMutation<
    MockLane,
    ApiError,
    { id: number; options: Partial<LaneOptions> },
    { previousLanes?: MockLane[]; previousLane?: MockLane }
  >({
    mutationFn: ({ id, options }) =>
      apiPost<MockLane>(`/lanes/${id}/options`, options),

    onMutate: async ({ id, options }) => {
      // Отменяем исходящие запросы, чтобы они не перезаписали оптимистичное состояние
      await queryClient.cancelQueries({ queryKey: ["lanes"] });
      await queryClient.cancelQueries({ queryKey: ["lane", id] });

      const previousLanes = queryClient.getQueryData<MockLane[]>(["lanes"]);
      const previousLane = queryClient.getQueryData<MockLane>(["lane", id]);

      // Оптимистично патчим список дорожек
      if (previousLanes) {
        queryClient.setQueryData<MockLane[]>(["lanes"], (old) => {
          if (!old) return old;
          return old.map((lane) =>
            lane.id === id
              ? {
                  ...lane,
                  options: { ...lane.options, ...options },
                }
              : lane
          );
        });
      }

      // Оптимистично патчим детальную карточку дорожки
      if (previousLane) {
        queryClient.setQueryData<MockLane>(["lane", id], {
          ...previousLane,
          options: { ...previousLane.options, ...options },
        });
      }

      return { previousLanes, previousLane };
    },

    onError: (err, { id }, context) => {
      // Откатываем оптимистичный апдейт при сетевой ошибке
      if (context?.previousLanes) {
        queryClient.setQueryData(["lanes"], context.previousLanes);
      }
      if (context?.previousLane) {
        queryClient.setQueryData(["lane", id], context.previousLane);
      }
      toast.error(err.problem?.detail || "Не удалось изменить опции дорожки");
    },

    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["lanes"] });
      queryClient.invalidateQueries({ queryKey: ["lane", id] });
    },
  });
}

/**
 * Опрос датчиков контроллера LCom.
 */
export function useLanePoll() {
  return useMutation<PinState, ApiError, number>({
    mutationFn: (id: number) => apiPost<PinState>(`/lanes/${id}/poll`),
  });
}
