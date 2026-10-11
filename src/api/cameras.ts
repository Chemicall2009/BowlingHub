/**
 * @file src/api/cameras.ts
 * @description Типизация и хуки для работы с камерами калибровки.
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "./client";

export type CameraType = "tvision" | "vdb" | "pin_deck";
export type CameraMode = "single_lane" | "dual_lane";

export interface Camera {
  id: string;
  name: string;
  type: CameraType;
  mode: CameraMode;
  lane_ids: number[];
  is_active: boolean;
  ip_address: string;
}

export const fetchCameras = async (): Promise<Camera[]> => {
  return apiGet<Camera[]>("/api/cameras");
};

export const fetchCameraSnapshot = async (cameraId: string): Promise<string> => {
  const data = await apiPost<{ url: string }>(`/api/cameras/${cameraId}/snapshot`);
  return data.url;
};

export const useCameras = () => {
  return useQuery({
    queryKey: ["cameras"],
    queryFn: fetchCameras,
  });
};

export const useCameraSnapshot = (cameraId: string | null) => {
  return useMutation({
    mutationFn: (id: string) => fetchCameraSnapshot(id),
  });
};
