/**
 * @file src/stores/sniffer.ts
 * @description Zustand-стор для управления фильтрами и состоянием UI сниффера.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FrameFilter } from "../api/sniffer";

const DEFAULT_FILTER: FrameFilter = {
  direction: "all",
  lane_id: "all",
  cmd: "all",
  only_errors: false,
  only_checksum_bad: false,
  search: "",
};

export type SnifferStore = {
  filter: FrameFilter;
  paused: boolean;
  autoScroll: boolean;
  selectedFrameId: string | null;
  setFilter: (filter: Partial<FrameFilter>) => void;
  resetFilter: () => void;
  setPaused: (paused: boolean) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  setSelectedFrameId: (id: string | null) => void;
};

export const useSnifferStore = create<SnifferStore>()(
  persist(
    (set) => ({
      filter: DEFAULT_FILTER,
      paused: false,
      autoScroll: true,
      selectedFrameId: null,
      setFilter: (newFilter) =>
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
        })),
      resetFilter: () => set({ filter: DEFAULT_FILTER }),
      setPaused: (paused) => set({ paused }),
      setAutoScroll: (autoScroll) => set({ autoScroll }),
      setSelectedFrameId: (selectedFrameId) => set({ selectedFrameId }),
    }),
    {
      name: "bowling-sniffer-filter",
      partialize: (state) => ({ filter: state.filter }),
    }
  )
);
