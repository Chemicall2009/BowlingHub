/**
 * @file src/stores/settings.ts
 * @description Zustand-стор для управления вкладкой UI в настройках.
 */

import { create } from "zustand";

export type SettingsTab = "transport" | "protocol" | "lanes" | "notifications" | "about";

type SettingsUIStore = {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
};

export const useSettingsUIStore = create<SettingsUIStore>((set) => ({
  activeTab: "transport",
  setActiveTab: (activeTab) => set({ activeTab }),
}));
