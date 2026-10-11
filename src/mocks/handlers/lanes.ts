/**
 * @file src/mocks/handlers/lanes.ts
 * @description MSW v2 обработчики эндпоинтов дорожек (/api/lanes).
 */

import { http, HttpResponse, delay } from "msw";
import {
  getMockLanes,
  updateMockLane,
  type MockLane,
  type MockShot,
} from "../data/lanes";
import type { LaneOptions, PinState } from "../../lib/lcom";

/**
 * Стандартный формат ошибки RFC 7807 Problem Details.
 */
export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
};

/**
 * Генерирует случайную сетевую задержку 80-200 мс.
 */
async function randomNetworkDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * 120) + 80;
  await delay(ms);
}

export const laneHandlers = [
  // GET /api/lanes — получение списка всех дорожек
  http.get("/api/lanes", async () => {
    await randomNetworkDelay();
    const lanes = getMockLanes();
    return HttpResponse.json(lanes satisfies MockLane[]);
  }),

  // GET /api/lanes/:id — получение данных конкретной дорожки
  http.get("/api/lanes/:id", async ({ params }) => {
    await randomNetworkDelay();
    const id = Number(params.id);
    const lanes = getMockLanes();
    const lane = lanes.find((l) => l.id === id);

    if (!lane) {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/not-found",
        title: "Дорожка не найдена",
        status: 404,
        detail: `Дорожка с идентификатором ${id} отсутствует в конфигурации зала`,
        instance: `/api/lanes/${id}`,
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 404,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    return HttpResponse.json(lane satisfies MockLane);
  }),

  // POST /api/lanes/:id/reset — сброс пинсеттера дорожки
  http.post("/api/lanes/:id/reset", async ({ params }) => {
    await randomNetworkDelay();
    const id = Number(params.id);
    const lanes = getMockLanes();
    const lane = lanes.find((l) => l.id === id);

    if (!lane) {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/not-found",
        title: "Дорожка не найдена",
        status: 404,
        detail: `Невозможно сбросить: дорожка ${id} не найдена`,
        instance: `/api/lanes/${id}/reset`,
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 404,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    const resetPins = [
      true, true, true, true, true,
      true, true, true, true, true,
    ];

    updateMockLane(id, {
      status: "online",
      pins: resetPins,
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      last_seen_at: new Date().toISOString(),
    });

    const updated = getMockLanes().find((l) => l.id === id)!;
    return HttpResponse.json(updated satisfies MockLane);
  }),

  // POST /api/lanes/:id/options — обновление опций дорожки (тумблеры)
  http.post("/api/lanes/:id/options", async ({ params, request }) => {
    await randomNetworkDelay();
    const id = Number(params.id);
    const lanes = getMockLanes();
    const lane = lanes.find((l) => l.id === id);

    if (!lane) {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/not-found",
        title: "Дорожка не найдена",
        status: 404,
        detail: `Невозможно обновить опции: дорожка ${id} не найдена`,
        instance: `/api/lanes/${id}/options`,
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 404,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    let body: Partial<LaneOptions>;
    try {
      body = (await request.json()) as Partial<LaneOptions>;
    } catch {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/bad-request",
        title: "Некорректное тело запроса",
        status: 400,
        detail: "Ожидался JSON объект с полями опций дорожки",
        instance: `/api/lanes/${id}/options`,
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    updateMockLane(id, {
      options: {
        ...lane.options,
        ...body,
      },
      last_seen_at: new Date().toISOString(),
    });

    const updated = getMockLanes().find((l) => l.id === id)!;
    return HttpResponse.json(updated satisfies MockLane);
  }),

  // POST /api/lanes/:id/poll — симуляция аппаратного опроса контроллера LCom
  http.post("/api/lanes/:id/poll", async ({ params }) => {
    await randomNetworkDelay();
    const id = Number(params.id);
    const lanes = getMockLanes();
    const lane = lanes.find((l) => l.id === id);

    if (!lane) {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/not-found",
        title: "Дорожка не найдена",
        status: 404,
        detail: `Невозможно опросить: дорожка ${id} не найдена`,
        instance: `/api/lanes/${id}/poll`,
      };
      return HttpResponse.json(error satisfies ProblemDetails, {
        status: 404,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    updateMockLane(id, {
      last_seen_at: new Date().toISOString(),
    });

    const pinState: PinState = {
      pins: lane.pins,
      foul1: lane.foul1,
      foul2: lane.foul2,
      split: lane.split,
      speed: lane.speed,
    };

    return HttpResponse.json(pinState satisfies PinState);
  }),

  // POST /api/lanes/:id/pins — ручная установка состояния кеглей
  http.post("/api/lanes/:id/pins", async ({ params, request }) => {
    await randomNetworkDelay();
    const id = Number(params.id);
    const lanes = getMockLanes();
    const lane = lanes.find((l) => l.id === id);

    if (!lane) {
      return HttpResponse.json(
        {
          type: "https://bowland.club/errors/not-found",
          title: "Дорожка не найдена",
          status: 404,
          detail: `Дорожка ${id} не найдена`,
        },
        { status: 404 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { pins?: boolean[] };
    if (Array.isArray(body.pins)) {
      updateMockLane(id, {
        pins: body.pins,
        last_seen_at: new Date().toISOString(),
      });
    }

    const updated = getMockLanes().find((l) => l.id === id)!;
    return HttpResponse.json(updated satisfies MockLane);
  }),

  // POST /api/lanes/:id/shots — добавление броска
  http.post("/api/lanes/:id/shots", async ({ params, request }) => {
    await randomNetworkDelay();
    const id = Number(params.id);
    const lanes = getMockLanes();
    const lane = lanes.find((l) => l.id === id);

    if (!lane) {
      return HttpResponse.json(
        {
          type: "https://bowland.club/errors/not-found",
          title: "Дорожка не найдена",
          status: 404,
          detail: `Дорожка ${id} не найдена`,
        },
        { status: 404 }
      );
    }

    const shotBody = (await request.json().catch(() => ({}))) as Partial<MockShot>;
    const newShot: MockShot = {
      id: `shot-${Date.now()}`,
      frame: shotBody.frame || (lane.current_game?.current_frame ?? 1),
      shot: shotBody.shot || 1,
      pins_down: shotBody.pins_down ?? 0,
      pins_state: shotBody.pins_state || lane.pins,
      is_foul: shotBody.is_foul || false,
      is_split: shotBody.is_split || false,
      ball_speed: shotBody.ball_speed ?? null,
      timestamp: new Date().toISOString(),
    };

    updateMockLane(id, {
      pins: newShot.pins_state,
      speed: newShot.ball_speed,
      foul1: newShot.is_foul,
      shots: [newShot, ...lane.shots],
      last_seen_at: new Date().toISOString(),
    });

    const updated = getMockLanes().find((l) => l.id === id)!;
    return HttpResponse.json(updated satisfies MockLane);
  }),
];
