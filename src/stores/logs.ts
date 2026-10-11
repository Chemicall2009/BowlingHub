/**
 * @file src/stores/logs.ts
 * @description Zustand-стор для сохранения фильтров и состояния пагинации логов в localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LogSource } from "../api/logs";

export type LogsFilterState = {
  from?: string;
  to?: string;
  lane_id: number | "all";
  cmd: number | "all";
  direction: "rx" | "tx" | "all";
  only_errors: boolean;
  search: string;
};

const DEFAULT_FILTERS: LogsFilterState = {
  lane_id: "all",
  cmd: "all",
  direction: "all",
  only_errors: false,
  search: "",
};

type LogsStore = {
  filters: LogsFilterState;
  activeTab: LogSource;
  pageSize: number;
  setFilter: (filter: Partial<LogsFilterState>) => void;
  resetFilters: () => void;
  setActiveTab: (tab: LogSource) => void;
  setPageSize: (size: number) => void;
};

export const useLogsStore = create<LogsStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      activeTab: "commands",
      pageSize: 50,
      setFilter: (newFilter) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilter },
        })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setPageSize: (pageSize) => set({ pageSize }),
    }),
    {
      name: "logs-filters-store",
      partialize: (state) => ({ filters: state.filters, pageSize: state.pageSize }),
    }
  )
);
