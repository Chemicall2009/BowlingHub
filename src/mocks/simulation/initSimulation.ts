/**
 * @file src/mocks/simulation/initSimulation.ts
 * @description Инициализация слушателя режима работы и симулятора боулинг-клуба.
 */

import { simulationManager } from "./simulationManager";
import { useOperationMode } from "../../stores/operationMode";

export function initSimulation(): () => void {
  // Подписываемся на смену режима эмуляции / боевого режима
  const unsub = useOperationMode.subscribe((state, prev) => {
    if (state.mode === "emulation" && prev?.mode !== "emulation") {
      simulationManager.autostartOnEmulation();
    }
    if (state.mode === "combat" && prev?.mode !== "combat") {
      simulationManager.shutdownOnCombat();
    }
  });

  // Если приложение уже загрузилось в режиме эмуляции — запускаем дорожки 1..6
  if (useOperationMode.getState().mode === "emulation") {
    simulationManager.autostartOnEmulation();
  }

  return unsub;
}
