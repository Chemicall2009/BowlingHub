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

export const handlers = [
  ...laneHandlers,
  ...gameHandlers,
  ...settingsHandlers,
  ...calibrationHandlers,
  ...snifferHandlers,
  ...logsHandlers,
];

export { laneHandlers, gameHandlers, settingsHandlers, calibrationHandlers, snifferHandlers, logsHandlers };
