/**
 * @file src/tv/types.ts
 * @description TypeScript types for TV display module.
 */

export type TvSnapshot = {
  type: "tv.snapshot";
  lane_id: number;
  lane_display: string;
  current_game: TvGame | null;
  pins: boolean[];
  foul1: boolean;
  foul2: boolean;
  split: boolean;
  speed_kmh: number | null;
  options: {
    bambini: boolean;
    cosmic: boolean;
    kbd_lock: boolean;
    no_speed: boolean;
    swap_off: boolean;
  };
  baud: number;
  lane_status: "online" | "offline" | "degraded";
  timestamp: string;
};

export type TvGame = {
  player_name: string;
  frame: number;
  shot_in_frame: number;
  score: number;
  players: TvPlayer[];
};

export type TvPlayer = {
  name: string;
  order_index: number;
  frames: TvFrame[];
  total: number;
  is_current: boolean;
};

export type TvFrame = {
  frame: number;
  rolls: (number | null)[];
  cumulative: number | null;
  is_strike: boolean;
  is_spare: boolean;
};

export type TvEvent =
  | TvSnapshot
  | {
      type: "tv.pins_changed";
      lane_id: number;
      pins: boolean[];
      foul1: boolean;
      foul2: boolean;
      split: boolean;
      speed_kmh: number | null;
      timestamp: string;
    }
  | {
      type: "tv.shot_registered";
      lane_id: number;
      player_name: string;
      pins_down: number;
      shot_number: number;
      frame_number: number;
      is_strike: boolean;
      is_spare: boolean;
      score_after: number;
      timestamp: string;
    }
  | {
      type: "tv.player_changed";
      lane_id: number;
      player_name: string;
      timestamp: string;
    }
  | {
      type: "tv.game_started";
      lane_id: number;
      player_names: string[];
      timestamp: string;
    }
  | {
      type: "tv.game_finished";
      lane_id: number;
      final_scores: { player: string; score: number }[];
      timestamp: string;
    }
  | { type: "tv.lane_reset"; lane_id: number; timestamp: string }
  | {
      type: "tv.lane_offline";
      lane_id: number;
      reason: string;
      timestamp: string;
    }
  | { type: "tv.error"; message: string; timestamp: string };
