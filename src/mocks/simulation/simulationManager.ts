/**
 * @file src/mocks/simulation/simulationManager.ts
 * @description Синглтон-менеджер симуляции боулинг-дорожек, управляющий всеми LaneSimulator (1..12).
 */

import { LaneSimulator } from "./laneSimulator";
import { DEFAULT_SIM_CONFIG, type SimConfig, type SimLaneState } from "./types";
import { useOperationMode } from "../../stores/operationMode";

class SimulationManager {
  private simulators: Map<number, LaneSimulator> = new Map();
  private globalConfig: SimConfig = { ...DEFAULT_SIM_CONFIG };

  constructor() {
    // Инициализируем симуляторы для всех 12 дорожек
    for (let id = 1; id <= 12; id++) {
      this.simulators.set(id, new LaneSimulator(id, this.globalConfig));
    }
  }

  getConfig(): SimConfig {
    return { ...this.globalConfig };
  }

  setConfig(cfg: Partial<SimConfig>): SimConfig {
    this.globalConfig = { ...this.globalConfig, ...cfg };
    for (const sim of this.simulators.values()) {
      sim.updateConfig(this.globalConfig);
    }
    return this.getConfig();
  }

  startLane(lane_id: number): void {
    if (useOperationMode.getState().mode !== "emulation") return;
    const sim = this.simulators.get(lane_id);
    if (sim) sim.start();
  }

  stopLane(lane_id: number): void {
    const sim = this.simulators.get(lane_id);
    if (sim) sim.stop();
  }

  pauseLane(lane_id: number): void {
    const sim = this.simulators.get(lane_id);
    if (sim) sim.pause();
  }

  resumeLane(lane_id: number): void {
    const sim = this.simulators.get(lane_id);
    if (sim) sim.resume();
  }

  throwNow(lane_id: number): void {
    if (useOperationMode.getState().mode !== "emulation") return;
    const sim = this.simulators.get(lane_id);
    if (sim) sim.throwNow();
  }

  resetLane(lane_id: number): void {
    const sim = this.simulators.get(lane_id);
    if (sim) sim.reset();
  }

  startAll(lane_ids?: number[]): void {
    if (useOperationMode.getState().mode !== "emulation") return;
    const targets = lane_ids && lane_ids.length > 0 ? lane_ids : Array.from({ length: 12 }, (_, i) => i + 1);
    targets.forEach((id) => this.startLane(id));
  }

  stopAll(lane_ids?: number[]): void {
    const targets = lane_ids && lane_ids.length > 0 ? lane_ids : Array.from({ length: 12 }, (_, i) => i + 1);
    targets.forEach((id) => this.stopLane(id));
  }

  pauseAll(lane_ids?: number[]): void {
    const targets = lane_ids && lane_ids.length > 0 ? lane_ids : Array.from({ length: 12 }, (_, i) => i + 1);
    targets.forEach((id) => this.pauseLane(id));
  }

  resumeAll(lane_ids?: number[]): void {
    const targets = lane_ids && lane_ids.length > 0 ? lane_ids : Array.from({ length: 12 }, (_, i) => i + 1);
    targets.forEach((id) => this.resumeLane(id));
  }

  getState(lane_id: number): SimLaneState | null {
    const sim = this.simulators.get(lane_id);
    return sim ? sim.getState() : null;
  }

  getActiveLanes(): number[] {
    const active: number[] = [];
    for (const [id, sim] of this.simulators.entries()) {
      if (sim.getState().running && !sim.getState().paused) {
        active.push(id);
      }
    }
    return active;
  }

  /**
   * Автозапуск при переключении в режим эмуляции.
   * Запускает симулятор на первых 6 дорожках (1-6), остальные 6 (7-12) остаются в ожидании.
   */
  autostartOnEmulation(): void {
    if (useOperationMode.getState().mode !== "emulation") return;
    // Запускаем дорожки 1..6
    for (let id = 1; id <= 6; id++) {
      this.startLane(id);
    }
  }

  /**
   * Остановка всех симуляций при переходе в боевой режим.
   */
  shutdownOnCombat(): void {
    this.stopAll();
  }
}

export const simulationManager = new SimulationManager();
