/**
 * @file src/mocks/handlers/index.ts
 * @description Экспорт всех MSW v2 обработчиков.
 */

import { laneHandlers } from "./lanes";
import { gameHandlers } from "./games";
import { settingsHandlers } from "./settings";
import { calibrationHandlers } from "./calibration";
import { snifferHandlers } from "./sniffer";
import { logsHandlers } from "./logs";
import { emulationHandlers } from "./emulation";

export const handlers = [
  ...laneHandlers,
  ...gameHandlers,
  ...settingsHandlers,
  ...calibrationHandlers,
  ...snifferHandlers,
  ...logsHandlers,
  ...emulationHandlers,
];

export {
  laneHandlers,
  gameHandlers,
  settingsHandlers,
  calibrationHandlers,
  snifferHandlers,
  logsHandlers,
  emulationHandlers,
};
