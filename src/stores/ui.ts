/**
 * @file src/stores/ui.ts
 * @description Zustand-стор состояния интерфейса (сайдбар, фильтры, отображение, тема).
 */

import { create } from "zustand";

export type ViewMode = "grid" | "list";
export type LaneFilter = "all" | "active" | "offline";
export type ThemeMode = "dark" | "light";

export interface UIState {
  /** Флаг открытого сайдбара */
  sidebarOpen: boolean;
  /** Флаг свернутого сайдбара на десктопе */
  sidebarCollapsed: boolean;
  /** Мобильный сайдбар (Sheet) */
  mobileSidebarOpen: boolean;
  /** Текущая тема интерфейса */
  theme: ThemeMode;
  /** Режим отображения дорожек (сетка/таблица) */
  viewMode: ViewMode;
  /** Фильтр статуса дорожек */
  filter: LaneFilter;
  /** Строка поиска дорожек */
  searchQuery: string;

  /** Действия */
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilter: (filter: LaneFilter) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: "dark",
  viewMode: "grid",
  filter: "all",
  searchQuery: "",

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
      sidebarCollapsed: !state.sidebarCollapsed,
    })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return { theme: nextTheme };
    }),
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ theme });
  },
  setViewMode: (viewMode) => set({ viewMode }),
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
