/**
 * @file src/stores/calibrationWizard.ts
 * @description Zustand-стор состояния мастера калибровки с сохранением прогресса в localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalibrationCameraType, Point } from "../api/calibration";

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  laneId: number | null;
  cameraId: string | null;
  cameraType: CalibrationCameraType;
  snapshotUrl: string | null;
  pinPositions: Point[] | null;
  polygonRoi: Point[] | null;
  isEditing: boolean;
  profileId: string | null;

  setStep: (step: 1 | 2 | 3 | 4) => void;
  setLane: (laneId: number | null) => void;
  setCameraId: (cameraId: string | null) => void;
  setCameraType: (cameraType: CalibrationCameraType) => void;
  setSnapshot: (url: string | null) => void;
  setPinPositions: (pins: Point[] | null) => void;
  setPolygonRoi: (roi: Point[] | null) => void;
  setIsEditing: (isEditing: boolean, profileId?: string | null) => void;
  reset: () => void;
}

const DEFAULT_PINS_640x480: Point[] = [
  { x: 320, y: 140 },
  { x: 280, y: 180 },
  { x: 360, y: 180 },
  { x: 240, y: 220 },
  { x: 320, y: 220 },
  { x: 400, y: 220 },
  { x: 200, y: 260 },
  { x: 280, y: 260 },
  { x: 360, y: 260 },
  { x: 440, y: 260 },
];

const DEFAULT_ROI_640x480: Point[] = [
  { x: 180, y: 110 },
  { x: 460, y: 110 },
  { x: 500, y: 300 },
  { x: 140, y: 300 },
];

export const useCalibrationWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      step: 1,
      laneId: 1,
      cameraId: null,
      cameraType: "tvision",
      snapshotUrl: null,
      pinPositions: [...DEFAULT_PINS_640x480],
      polygonRoi: [...DEFAULT_ROI_640x480],
      isEditing: false,
      profileId: null,

      setStep: (step) => set({ step }),
      setLane: (laneId) => set({ laneId }),
      setCameraId: (cameraId) => set({ cameraId }),
      setCameraType: (cameraType) => set({ cameraType }),
      setSnapshot: (url) => {
        const oldUrl = get().snapshotUrl;
        if (oldUrl && oldUrl.startsWith("blob:") && oldUrl !== url) {
          try {
            URL.revokeObjectURL(oldUrl);
          } catch {
            // ignore
          }
        }
        set({ snapshotUrl: url });
      },
      setPinPositions: (pinPositions) => set({ pinPositions }),
      setPolygonRoi: (polygonRoi) => set({ polygonRoi }),
      setIsEditing: (isEditing, profileId = null) =>
        set({ isEditing, profileId }),

      reset: () => {
        const oldUrl = get().snapshotUrl;
        if (oldUrl && oldUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(oldUrl);
          } catch {
            // ignore
          }
        }
        set({
          step: 1,
          laneId: 1,
          cameraId: null,
          cameraType: "tvision",
          snapshotUrl: null,
          pinPositions: [...DEFAULT_PINS_640x480],
          polygonRoi: [...DEFAULT_ROI_640x480],
          isEditing: false,
          profileId: null,
        });
      },
    }),
    {
      name: "bowland-calibration-wizard",
    }
  )
);
