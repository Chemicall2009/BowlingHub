import { apiClient } from "./client";
import type { Game, PlayerScore } from "./types";

export interface CreateGamePayload {
  lane_id: number;
  players: string[];
}

export interface RecordShotPayload {
  pins_down: number;
  pins_state?: boolean[];
  foul?: boolean;
  speed?: number;
}

export async function getGame(id: string): Promise<Game> {
  return apiClient<Game>(`/games/${id}`);
}

export async function getScoreboard(gameId: string): Promise<PlayerScore[]> {
  return apiClient<PlayerScore[]>(`/games/${gameId}/scoreboard`);
}

export async function createGame(payload: CreateGamePayload): Promise<Game> {
  return apiClient<Game>("/games", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordShot(gameId: string, payload: RecordShotPayload): Promise<Game> {
  return apiClient<Game>(`/games/${gameId}/shots`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function newFrame(laneId: number): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/lanes/${laneId}/new-frame`, {
    method: "POST",
  });
}
