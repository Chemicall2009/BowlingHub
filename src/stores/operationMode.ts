/**
 * @file src/stores/operationMode.ts
 * @description Zustand store for operation mode (emulation vs combat) with localStorage persistence.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OperationMode = "emulation" | "combat";

type OperationModeState = {
  mode: OperationMode;
  setMode: (mode: OperationMode) => void;
  isEmulation: () => boolean;
  isCombat: () => boolean;
};

export const useOperationMode = create<OperationModeState>()(
  persist(
    (set, get) => ({
      mode: "emulation",
      setMode: (mode) => set({ mode }),
      isEmulation: () => get().mode === "emulation",
      isCombat: () => get().mode === "combat",
    }),
    { name: "bowling.operationMode" }
  )
);
