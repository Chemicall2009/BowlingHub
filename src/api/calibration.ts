/**
 * @file src/api/calibration.ts
 * @description API клиент и React Query хуки для калибровки камер подсчёта очков.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut, apiDelete, type ApiError } from "./client";
import type { PinState } from "../lib/lcom";

export type CalibrationCameraType = "tvision" | "vdb" | "pin_deck";

export type Point = {
  x: number;
  y: number;
};

export type CalibrationProfile = {
  id: string;
  lane_id: number;
  camera_type: CalibrationCameraType;
  polygon_roi: Point[]; // 4 точки (произвольная форма)
  pin_positions: Point[]; // ровно 10 точек
  reference_frame_url: string; // URL сохранённого эталона
  is_active: boolean;
  created_at: string;
  updated_at: string;
  notes: string | null;
};

export type CreateProfileDto = Omit<
  CalibrationProfile,
  "id" | "created_at" | "updated_at" | "reference_frame_url"
> & {
  reference_frame_url?: string;
};

export type UpdateProfileDto = Partial<CreateProfileDto>;

export type CalibrationTestResult = {
  detected_pins: boolean[]; // длина 10
  confidence: number; // 0..1
  debug_overlay_url: string; // картинка с наложенной разметкой
  raw_pin_state: PinState;
};

// Legacy интерфейс калибровки контроллера
export interface CalibrationData {
  lane_id: number;
  foul_threshold: number;
  ball_detect_delay_ms: number;
  camera_offset_x: number;
  camera_offset_y: number;
  pin_matrix_calibrated: boolean;
}

export async function getCalibration(laneId: number): Promise<CalibrationData> {
  return apiGet<CalibrationData>(`/calibration/${laneId}`);
}

export async function saveCalibration(
  laneId: number,
  data: Partial<CalibrationData>
): Promise<CalibrationData> {
  return apiPost<CalibrationData>(`/calibration/${laneId}`, data);
}

// Функции прямого вызова API профилей калибровки
export async function getCalibrationProfiles(
  laneId?: number
): Promise<CalibrationProfile[]> {
  const params = laneId ? { lane_id: laneId } : undefined;
  return apiGet<CalibrationProfile[]>("/calibration/profiles", params);
}

export async function getCalibrationProfile(
  id: string
): Promise<CalibrationProfile> {
  return apiGet<CalibrationProfile>(`/calibration/profiles/${id}`);
}

export async function createProfile(
  dto: CreateProfileDto & { reference_frame_url?: string }
): Promise<CalibrationProfile> {
  return apiPost<CalibrationProfile>("/calibration/profiles", dto);
}

export async function updateProfile(
  id: string,
  dto: UpdateProfileDto
): Promise<CalibrationProfile> {
  return apiPut<CalibrationProfile>(`/calibration/profiles/${id}`, dto);
}

export async function deleteProfile(id: string): Promise<void> {
  return apiDelete<void>(`/calibration/profiles/${id}`);
}

export async function activateProfile(id: string): Promise<CalibrationProfile> {
  return apiPost<CalibrationProfile>(`/calibration/profiles/${id}/activate`);
}

export async function uploadSnapshot(
  laneId: number,
  file: File | FormData
): Promise<{ url: string }> {
  const formData = file instanceof FormData ? file : new FormData();
  if (file instanceof File) {
    formData.append("file", file);
  }
  return apiPost<{ url: string }>(`/calibration/${laneId}/snapshot`, formData);
}

export async function testCalibration(
  profileId: string,
  testSnapshotUrl?: string
): Promise<CalibrationTestResult> {
  return apiPost<CalibrationTestResult>(
    `/calibration/profiles/${profileId}/test`,
    { test_snapshot_url: testSnapshotUrl }
  );
}

// React Query хуки
export function useCalibrationProfiles(laneId?: number) {
  return useQuery<CalibrationProfile[], ApiError>({
    queryKey: ["calibration-profiles", laneId],
    queryFn: () => getCalibrationProfiles(laneId),
  });
}

export function useCalibrationProfile(id: string | null | undefined) {
  return useQuery<CalibrationProfile, ApiError>({
    queryKey: ["calibration-profile", id],
    queryFn: () => getCalibrationProfile(id!),
    enabled: !!id,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation<
    CalibrationProfile,
    ApiError,
    CreateProfileDto & { reference_frame_url?: string }
  >({
    mutationFn: (dto) => createProfile(dto),
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ["calibration-profiles"] });
      toast.success(`Профиль калибровки для дорожки ${profile.lane_id} создан`);
    },
    onError: (err) => {
      toast.error(err.problem?.detail || "Ошибка при создании профиля калибровки");
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<
    CalibrationProfile,
    ApiError,
    { id: string; dto: UpdateProfileDto }
  >({
    mutationFn: ({ id, dto }) => updateProfile(id, dto),
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ["calibration-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["calibration-profile", profile.id] });
      toast.success("Профиль калибровки обновлён");
    },
    onError: (err) => {
      toast.error(err.problem?.detail || "Ошибка при обновлении профиля");
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calibration-profiles"] });
      toast.success("Профиль калибровки удалён");
    },
    onError: (err) => {
      toast.error(err.problem?.detail || "Ошибка при удалении профиля");
    },
  });
}

export function useActivateProfile() {
  const queryClient = useQueryClient();
  return useMutation<CalibrationProfile, ApiError, string>({
    mutationFn: (id) => activateProfile(id),
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ["calibration-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["calibration-profile", profile.id] });
      toast.success(`Профиль ${profile.id} активирован для дорожки ${profile.lane_id}`);
    },
    onError: (err) => {
      toast.error(err.problem?.detail || "Не удалось активировать профиль");
    },
  });
}

export function useUploadSnapshot(laneId: number) {
  return useMutation<{ url: string }, ApiError, File | FormData>({
    mutationFn: (file) => uploadSnapshot(laneId, file),
    onError: (err) => {
      toast.error(err.problem?.detail || "Ошибка загрузки снимка с камеры");
    },
  });
}

export function useTestCalibration(profileId?: string) {
  return useMutation<
    CalibrationTestResult,
    ApiError,
    { profileId: string; testSnapshotUrl?: string } | void
  >({
    mutationFn: (vars) => {
      const id = vars?.profileId || profileId;
      if (!id) throw new Error("profileId is required");
      return testCalibration(id, vars?.testSnapshotUrl);
    },
    onError: (err) => {
      toast.error(err.problem?.detail || "Ошибка тестирования калибровки");
    },
  });
}
