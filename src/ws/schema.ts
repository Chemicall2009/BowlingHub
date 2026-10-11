/**
 * @file src/ws/schema.ts
 * @description Zod-схемы валидации входящих WebSocket сообщений и функция безопасного парсинга.
 */

import { z } from "zod";
import type { ServerEvent } from "./protocol";

const laneStatusChangedSchema = z.object({
  type: z.literal("lane.status_changed"),
  lane_id: z.number().int(),
  status: z.enum(["online", "offline", "degraded"]),
  timestamp: z.string(),
});

const lanePinsChangedSchema = z.object({
  type: z.literal("lane.pins_changed"),
  lane_id: z.number().int(),
  pins: z.array(z.boolean()),
  foul1: z.boolean(),
  foul2: z.boolean(),
  split: z.boolean(),
  speed: z.number().nullable(),
  timestamp: z.string(),
});

const laneOptionsChangedSchema = z.object({
  type: z.literal("lane.options_changed"),
  lane_id: z.number().int(),
  options: z.object({
    bambini: z.boolean(),
    cosmic: z.boolean(),
    kbd_lock: z.boolean(),
    no_speed: z.boolean(),
    swap_off: z.boolean(),
  }),
  timestamp: z.string(),
});

const laneOfflineSchema = z.object({
  type: z.literal("lane.offline"),
  lane_id: z.number().int(),
  reason: z.string(),
  timestamp: z.string(),
});

const gameCreatedSchema = z.object({
  type: z.literal("game.created"),
  game_id: z.string(),
  lane_id: z.number().int(),
  players: z.array(z.string()),
  timestamp: z.string(),
});

const gameShotRegisteredSchema = z.object({
  type: z.literal("game.shot_registered"),
  game_id: z.string(),
  lane_id: z.number().int(),
  player_name: z.string(),
  pins_down: z.number().int(),
  is_foul: z.boolean(),
  timestamp: z.string(),
});

const gameFinishedSchema = z.object({
  type: z.literal("game.finished"),
  game_id: z.string(),
  final_scores: z.array(z.object({ player: z.string(), score: z.number().int() })),
  timestamp: z.string(),
});

const snifferFrameSchema = z.object({
  type: z.literal("sniffer.frame"),
  frame: z.any(),
  timestamp: z.string(),
});

const snifferStatusSchema = z.object({
  type: z.literal("sniffer.status"),
  status: z.any(),
  timestamp: z.string(),
});

const emulatorResponseSchema = z.object({
  type: z.literal("emulator.response"),
  command_id: z.string(),
  result: z.any(),
  timestamp: z.string(),
});

const logEntrySchema = z.object({
  type: z.literal("log.entry"),
  entry: z.any(),
  timestamp: z.string(),
});

const connectionStatusSchema = z.object({
  type: z.literal("connection.status"),
  transport: z.string(),
  endpoint: z.string(),
  baud: z.number(),
  status: z.enum(["online", "degraded", "offline"]),
  timestamp: z.string(),
});

const errorEventSchema = z.object({
  type: z.literal("error"),
  code: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

const pingPongSchema = z.object({
  type: z.enum(["ping", "pong"]),
  timestamp: z.string(),
});

const serverEventUnionSchema = z.discriminatedUnion("type", [
  laneStatusChangedSchema,
  lanePinsChangedSchema,
  laneOptionsChangedSchema,
  laneOfflineSchema,
  gameCreatedSchema,
  gameShotRegisteredSchema,
  gameFinishedSchema,
  snifferFrameSchema,
  snifferStatusSchema,
  emulatorResponseSchema,
  logEntrySchema,
  connectionStatusSchema,
  errorEventSchema,
  pingPongSchema,
]);

/**
 * Безопасно парсит входящий JSON в дискриминированное событие ServerEvent.
 */
export function parseServerEvent(json: unknown): ServerEvent | null {
  const result = serverEventUnionSchema.safeParse(json);
  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn("[WebSocket] Invalid server event received:", result.error.format());
    }
    return null;
  }
  return result.data as ServerEvent;
}
