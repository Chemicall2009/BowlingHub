export type LaneStatus = "online" | "offline" | "degraded";

export interface LaneOptions {
  bambini: boolean;
  cosmic: boolean;
  kbd_lock: boolean;
  no_speed: boolean;
  swap_off: boolean;
}

export interface Shot {
  id: string;
  frame: number;
  shot: number;
  pins_down: number;
  pins_state: boolean[]; // 10 pins: true = standing, false = down
  is_foul: boolean;
  is_split: boolean;
  ball_speed: number | null;
  timestamp: string;
}

export interface CurrentGameSummary {
  id: string;
  player_name: string;
  score: number;
  current_frame: number;
  balls_left?: number;
}

export interface Lane {
  id: number;
  number: number;
  name: string | null;
  pair_number?: number; // e.g. lane 1 and 2 share pair 1
  is_active: boolean;
  status: LaneStatus;
  last_seen_at: string;
  current_game: CurrentGameSummary | null;
  options: LaneOptions;
  pins: boolean[]; // 10 items (true = standing, false = knocked down)
  foul1: boolean;
  foul2: boolean;
  split: boolean;
  speed: number | null;
  bumper_up?: boolean;
  shots: Shot[];
}

export interface FrameScore {
  frame: number;
  rolls: (number | "X" | "/" | "F" | "-")[];
  score: number | null;
  is_split?: boolean;
}

export interface PlayerScore {
  id: string;
  name: string;
  frames: FrameScore[];
  total_score: number;
  is_current?: boolean;
}

export interface Game {
  id: string;
  lane_id: number;
  status: "active" | "finished";
  players: PlayerScore[];
  current_player_index: number;
  current_frame: number;
  started_at: string;
}

export interface Settings {
  transport: "serial" | "tcp" | "mock";
  serial_port: string | null;
  serial_baud: 9600 | 19200 | 38400;
  tcp_host: string | null;
  tcp_port: number | null;
  xor_mask_hex: string;
  checksum_variant: "sum256" | "xor";
  frame_length: 30 | 31;
  lanes_count: number;
  lanes_start_number: number;
  poll_interval_ms: number;
  poll_timeout_ms: number;
  inter_packet_delay_ms: number;
  auto_baud_switch: boolean;
  notifications: {
    on_lane_offline: boolean;
    on_checksum_error: boolean;
    on_connection_lost: boolean;
    sound_enabled: boolean;
    email_webhook: string | null;
  };
}

export interface ResetLaneResponse {
  success: boolean;
  message: string;
  lane_id: number;
  timestamp: string;
}
