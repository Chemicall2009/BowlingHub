/**
 * @file src/mocks/handlers/games.ts
 * @description MSW v2 обработчики эндпоинтов игровых сессий (/api/games).
 */

import { http, HttpResponse, delay } from "msw";
import {
  getMockLanes,
  updateMockLane,
  type MockShot,
} from "../data/lanes";
import type { ProblemDetails } from "./lanes";
import type { PlayerScore, FrameScore } from "../../api/types";

export type MockGame = {
  id: string;
  lane_id: number;
  players: PlayerScore[];
  current_player: string;
  frame: number;
  score: number;
  status: "active" | "completed";
  started_at: string;
  current_player_index?: number;
  current_frame?: number;
};

function createInitialFrames(existing: Partial<FrameScore>[] = []): FrameScore[] {
  return Array.from({ length: 10 }, (_, i) => {
    const frameNum = i + 1;
    const found = existing.find((f) => f.frame === frameNum);
    return {
      frame: frameNum,
      rolls: found?.rolls || [],
      score: found?.score ?? null,
      is_split: found?.is_split,
    };
  });
}

// In-memory хранилище активных игр с полными структурами игроков и 10 фреймов
export const gamesStore: Map<string, MockGame> = new Map([
  [
    "game-lane-6",
    {
      id: "game-lane-6",
      lane_id: 6,
      current_player: "Алексей",
      frame: 1,
      score: 10,
      status: "active",
      started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      players: [
        {
          id: "p-6-1",
          name: "Алексей",
          is_current: true,
          total_score: 10,
          frames: createInitialFrames([
            { frame: 1, rolls: ["X"], score: 10 },
          ]),
        },
      ],
    },
  ],
  [
    "game-lane-7",
    {
      id: "game-lane-7",
      lane_id: 7,
      current_player: "Мария",
      frame: 5,
      score: 87,
      status: "active",
      started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      players: [
        {
          id: "p-7-1",
          name: "Мария",
          is_current: true,
          total_score: 87,
          frames: createInitialFrames([
            { frame: 1, rolls: [8, "/"], score: 20 },
            { frame: 2, rolls: ["X"], score: 40 },
            { frame: 3, rolls: [9, "/"], score: 60 },
            { frame: 4, rolls: ["X"], score: 80 },
            { frame: 5, rolls: [7], score: 87 },
          ]),
        },
      ],
    },
  ],
  [
    "game-lane-8",
    {
      id: "game-lane-8",
      lane_id: 8,
      current_player: "Дмитрий",
      frame: 9,
      score: 178,
      status: "active",
      started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      players: [
        {
          id: "p-8-1",
          name: "Дмитрий",
          is_current: true,
          total_score: 178,
          frames: createInitialFrames([
            { frame: 1, rolls: ["X"], score: 20 },
            { frame: 2, rolls: ["X"], score: 40 },
            { frame: 3, rolls: ["X"], score: 60 },
            { frame: 4, rolls: [8, 1], score: 69, is_split: true },
            { frame: 5, rolls: ["X"], score: 89 },
            { frame: 6, rolls: ["X"], score: 109 },
            { frame: 7, rolls: ["X"], score: 129 },
            { frame: 8, rolls: ["X"], score: 149 },
            { frame: 9, rolls: ["X"], score: 178 },
          ]),
        },
      ],
    },
  ],
]);

async function randomNetworkDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * 120) + 80;
  await delay(ms);
}

export const gameHandlers = [
  // POST /api/games — создание новой игры на дорожке
  http.post("/api/games", async ({ request }) => {
    await randomNetworkDelay();

    type CreateGameBody = {
      lane_id: number;
      players: string[];
    };

    let body: CreateGameBody;
    try {
      body = (await request.json()) as CreateGameBody;
    } catch {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/bad-request",
        title: "Некорректное тело запроса",
        status: 400,
        detail: "Ожидался JSON объект { lane_id, players }",
        instance: "/api/games",
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    const { lane_id, players } = body;
    const lanes = getMockLanes();
    const lane = lanes.find((l) => l.id === lane_id);

    if (!lane) {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/not-found",
        title: "Дорожка не найдена",
        status: 404,
        detail: `Невозможно создать игру: дорожка ${lane_id} отсутствует`,
        instance: "/api/games",
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 404,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    const gameId = `game-lane-${lane_id}-${Date.now()}`;
    const rawPlayerNames = players.length > 0 ? players : ["Игрок 1"];
    const mainPlayer = rawPlayerNames[0];

    const playerScores: PlayerScore[] = rawPlayerNames.map((name, index) => ({
      id: `p-${lane_id}-${index}-${Date.now()}`,
      name,
      is_current: index === 0,
      total_score: 0,
      frames: createInitialFrames(),
    }));

    const newGame: MockGame = {
      id: gameId,
      lane_id,
      players: playerScores,
      current_player: mainPlayer,
      frame: 1,
      current_frame: 1,
      current_player_index: 0,
      score: 0,
      status: "active",
      started_at: new Date().toISOString(),
    };

    gamesStore.set(gameId, newGame);

    // Обновляем состояние дорожки
    const allStanding = [
      true, true, true, true, true,
      true, true, true, true, true,
    ];

    updateMockLane(lane_id, {
      is_active: true,
      pins: allStanding,
      current_game: {
        id: gameId,
        player_name: mainPlayer,
        score: 0,
        current_frame: 1,
      },
      shots: [],
      last_seen_at: new Date().toISOString(),
    });

    return HttpResponse.json(newGame satisfies MockGame, { status: 201 });
  }),

  // GET /api/games/:id — получение данных игры
  http.get("/api/games/:id", async ({ params }) => {
    await randomNetworkDelay();
    const id = params.id as string;
    const game = gamesStore.get(id);

    if (!game) {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/not-found",
        title: "Игра не найдена",
        status: 404,
        detail: `Сессия игры с id "${id}" не найдена`,
        instance: `/api/games/${id}`,
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 404,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    return HttpResponse.json(game satisfies MockGame);
  }),

  // POST /api/games/:id/shots — добавление броска и пересчет счета
  http.post("/api/games/:id/shots", async ({ params, request }) => {
    await randomNetworkDelay();
    const id = params.id as string;
    const game = gamesStore.get(id);

    if (!game) {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/not-found",
        title: "Игра не найдена",
        status: 404,
        detail: `Невозможно добавить бросок: игра "${id}" не найдена`,
        instance: `/api/games/${id}/shots`,
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 404,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    type ShotBody = {
      pins_down: number;
      foul?: boolean;
    };

    let body: ShotBody;
    try {
      body = (await request.json()) as ShotBody;
    } catch {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/bad-request",
        title: "Некорректное тело броска",
        status: 400,
        detail: "Ожидался JSON объект { pins_down, foul }",
        instance: `/api/games/${id}/shots`,
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    const { pins_down, foul = false } = body;
    const addedScore = foul ? 0 : Math.max(0, Math.min(10, pins_down));

    // Обновляем счет игры
    game.score += addedScore;

    // Обновляем текущего игрока и его фрейм
    const activePlayer = game.players.find((p) => p.is_current) || game.players[0];
    if (activePlayer) {
      activePlayer.total_score = game.score;
      const currentFrameObj = activePlayer.frames.find((f) => f.frame === game.frame);
      if (currentFrameObj) {
        const rollSymbol = foul ? "F" : addedScore === 10 ? "X" : addedScore;
        currentFrameObj.rolls.push(rollSymbol);
        currentFrameObj.score = game.score;
      }
    }

    if (game.frame < 10) {
      game.frame += 1;
    } else {
      game.status = "completed";
    }

    // Добавляем бросок в историю дорожки
    const lanes = getMockLanes();
    const lane = lanes.find((l) => l.id === game.lane_id);

    if (lane) {
      const remainingPinsCount = Math.max(0, 10 - addedScore);
      const newPins = Array.from({ length: 10 }, (_, i) => i < remainingPinsCount);

      const shotRecord: MockShot = {
        id: `shot-${lane.id}-${Date.now()}`,
        frame: game.frame,
        shot: 1,
        pins_down: addedScore,
        pins_state: newPins,
        is_foul: foul,
        is_split: !foul && addedScore === 8,
        ball_speed: 1050,
        timestamp: new Date().toISOString(),
      };

      const updatedShots = [shotRecord, ...lane.shots];

      updateMockLane(lane.id, {
        pins: newPins,
        foul1: foul,
        current_game: {
          id: game.id,
          player_name: game.current_player,
          score: game.score,
          current_frame: game.frame,
        },
        shots: updatedShots,
        last_seen_at: new Date().toISOString(),
      });
    }

    return HttpResponse.json(game satisfies MockGame);
  }),
];
