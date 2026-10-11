/**
 * @file src/mocks/simulation/types.ts
 * @description Типы данных и конфигурация модуля симуляции боулинг-игр.
 */

export type SimConfig = {
  enabled: boolean;
  throw_interval_ms: number; // между бросками, default 8000
  players_per_game: number; // default 2
  strike_probability: number; // 0..1, default 0.35
  spare_probability: number; // 0..1, default 0.40
  foul_probability: number; // 0..1, default 0.02
  realistic_speed: boolean; // генерировать скорость 15..25 км/ч
  pause_between_frames_ms: number; // default 1500
};

export const DEFAULT_SIM_CONFIG: SimConfig = {
  enabled: true,
  throw_interval_ms: 8000,
  players_per_game: 2,
  strike_probability: 0.35,
  spare_probability: 0.40,
  foul_probability: 0.02,
  realistic_speed: true,
  pause_between_frames_ms: 1500,
};

export type SimLaneState = {
  lane_id: number;
  running: boolean;
  paused: boolean;
  timer: ReturnType<typeof setInterval> | null;
  last_throw_at: number;
  throw_count: number;
};
