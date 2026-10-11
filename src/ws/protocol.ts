/**
 * @file src/ws/protocol.ts
 * @description Дискриминированное объединение (discriminated union) всех серверных WebSocket событий.
 */

import type { SnifferFrame, SnifferStatus } from "../api/sniffer";
import type { LaneOptions, ParsedFrame } from "../lib/lcom";

export type LaneStatus = "online" | "offline" | "degraded";

export type SendResult = {
  sent_at: string;
  raw_hex: string;
  response_hex: string | null;
  parsed_response: ParsedFrame | null;
  duration_ms: number;
  error: string | null;
};

export type CommandLogEntry = {
  id: string;
  timestamp: string;
  lane_id: number;
  cmd: number;
  cmd_name: string;
  dry_run: boolean;
  raw_hex: string;
  response_hex: string | null;
  checksum_ok: boolean | null;
  duration_ms: number;
  error: string | null;
};

export type ServerEvent =
  | { type: "lane.status_changed"; lane_id: number; status: LaneStatus; timestamp: string }
  | {
      type: "lane.pins_changed";
      lane_id: number;
      pins: boolean[];
      foul1: boolean;
      foul2: boolean;
      split: boolean;
      speed: number | null;
      timestamp: string;
    }
  | { type: "lane.options_changed"; lane_id: number; options: LaneOptions; timestamp: string }
  | { type: "lane.offline"; lane_id: number; reason: string; timestamp: string }
  | { type: "game.created"; game_id: string; lane_id: number; players: string[]; timestamp: string }
  | {
      type: "game.shot_registered";
      game_id: string;
      lane_id: number;
      player_name: string;
      pins_down: number;
      is_foul: boolean;
      timestamp: string;
    }
  | { type: "game.finished"; game_id: string; final_scores: { player: string; score: number }[]; timestamp: string }
  | { type: "sniffer.frame"; frame: SnifferFrame; timestamp: string }
  | { type: "sniffer.status"; status: SnifferStatus; timestamp: string }
  | { type: "emulator.response"; command_id: string; result: SendResult; timestamp: string }
  | { type: "log.entry"; entry: CommandLogEntry; timestamp: string }
  | {
      type: "connection.status";
      transport: string;
      endpoint: string;
      baud: number;
      status: "online" | "degraded" | "offline";
      timestamp: string;
    }
  | { type: "error"; code: string; message: string; timestamp: string }
  | { type: "ping"; timestamp: string }
  | { type: "pong"; timestamp: string };

export type ServerEventType = ServerEvent["type"];
