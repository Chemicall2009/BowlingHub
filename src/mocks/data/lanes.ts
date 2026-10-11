/**
 * @file src/mocks/data/lanes.ts
 * @description Мок-данные 12 дорожек боулинг-клуба для MSW с реалистичными сценариями.
 */

import type { LaneOptions } from "../../lib/lcom";

/**
 * Запись одного броска в истории дорожки.
 */
export type MockShot = {
  id: string;
  frame: number;
  shot: number;
  pins_down: number;
  pins_state: boolean[];
  is_foul: boolean;
  is_split: boolean;
  ball_speed: number | null;
  timestamp: string;
};

/**
 * Описание состояния дорожки в клубе.
 */
export type MockLane = {
  id: number; // 1..12
  number: number; // Отображаемый номер дорожки
  name: string | null;
  status: "online" | "offline" | "degraded";
  is_active: boolean;
  last_seen_at: string; // ISO дата/время
  options: LaneOptions;
  pins: boolean[]; // 10 элементов (true = стоит, false = сбита)
  foul1: boolean;
  foul2: boolean;
  split: boolean;
  speed: number | null;
  current_game: {
    id: string;
    player_name: string;
    score: number;
    current_frame: number; // 1..10
  } | null;
  shots: MockShot[];
};

const DEFAULT_OPTIONS: LaneOptions = {
  bambini: false,
  cosmic: false,
  kbd_lock: false,
  no_speed: false,
  swap_off: false,
};

const ALL_STANDING_PINS: boolean[] = [
  true, true, true, true, true,
  true, true, true, true, true,
];

const ALL_DOWN_PINS: boolean[] = [
  false, false, false, false, false,
  false, false, false, false, false,
];

/**
 * Создает эталонный массив 12 мок-дорожек.
 */
function createInitialMockLanes(): MockLane[] {
  const now = new Date();
  const recentTime = now.toISOString();
  const oldTime = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(); // 2 дня назад

  return [
    // Дорожки 1..5: Online, в покое
    {
      id: 1,
      number: 1,
      name: "Дорожка 1",
      status: "online",
      is_active: false,
      last_seen_at: recentTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
    },
    {
      id: 2,
      number: 2,
      name: "Дорожка 2",
      status: "online",
      is_active: false,
      last_seen_at: recentTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
    },
    {
      id: 3,
      number: 3,
      name: "Дорожка 3",
      status: "online",
      is_active: false,
      last_seen_at: recentTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
    },
    {
      id: 4,
      number: 4,
      name: "Дорожка 4",
      status: "online",
      is_active: false,
      last_seen_at: recentTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
    },
    {
      id: 5,
      number: 5,
      name: "Дорожка 5",
      status: "online",
      is_active: false,
      last_seen_at: recentTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
    },

    // Дорожка 6: Online, активная игра (Алексей, фрейм 1, первый бросок — страйк)
    {
      id: 6,
      number: 6,
      name: "Дорожка 6",
      status: "online",
      is_active: true,
      last_seen_at: recentTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_DOWN_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: 1020,
      current_game: {
        id: "game-lane-6",
        player_name: "Алексей",
        score: 0,
        current_frame: 1,
      },
      shots: [
        {
          id: "shot-6-1",
          frame: 1,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 1020,
          timestamp: new Date(now.getTime() - 40 * 1000).toISOString(),
        },
      ],
    },

    // Дорожка 7: Online, активная игра (Мария, фрейм 5, score 87, shots 7, cosmic + bambini)
    {
      id: 7,
      number: 7,
      name: "Дорожка 7",
      status: "online",
      is_active: true,
      last_seen_at: recentTime,
      options: {
        ...DEFAULT_OPTIONS,
        cosmic: true,
        bambini: true,
      },
      pins: [false, true, false, false, true, false, false, true, false, false],
      foul1: false,
      foul2: false,
      split: false,
      speed: 1240,
      current_game: {
        id: "game-lane-7",
        player_name: "Мария",
        score: 87,
        current_frame: 5,
      },
      shots: [
        {
          id: "shot-7-1",
          frame: 1,
          shot: 1,
          pins_down: 8,
          pins_state: [false, false, true, false, false, false, true, false, false, false],
          is_foul: false,
          is_split: false,
          ball_speed: 1190,
          timestamp: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-7-2",
          frame: 1,
          shot: 2,
          pins_down: 2,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 1220,
          timestamp: new Date(now.getTime() - 13 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-7-3",
          frame: 2,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 1100,
          timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-7-4",
          frame: 3,
          shot: 1,
          pins_down: 9,
          pins_state: [false, false, false, false, false, false, false, false, false, true],
          is_foul: false,
          is_split: false,
          ball_speed: 1250,
          timestamp: new Date(now.getTime() - 7 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-7-5",
          frame: 3,
          shot: 2,
          pins_down: 1,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 1230,
          timestamp: new Date(now.getTime() - 6 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-7-6",
          frame: 4,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 1080,
          timestamp: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-7-7",
          frame: 5,
          shot: 1,
          pins_down: 7,
          pins_state: [false, true, false, false, true, false, false, true, false, false],
          is_foul: false,
          is_split: false,
          ball_speed: 1240,
          timestamp: new Date(now.getTime() - 50 * 1000).toISOString(),
        },
      ],
    },

    // Дорожка 8: Online, активная игра (Дмитрий, фрейм 9, score 178, shots 16, split в броске)
    {
      id: 8,
      number: 8,
      name: "Дорожка 8",
      status: "online",
      is_active: true,
      last_seen_at: recentTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [false, false, false, false, false, false, false, false, false, false],
      foul1: false,
      foul2: false,
      split: false,
      speed: 980,
      current_game: {
        id: "game-lane-8",
        player_name: "Дмитрий",
        score: 178,
        current_frame: 9,
      },
      shots: [
        {
          id: "shot-8-1",
          frame: 1,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 950,
          timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-8-2",
          frame: 2,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 960,
          timestamp: new Date(now.getTime() - 22 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-8-3",
          frame: 3,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 940,
          timestamp: new Date(now.getTime() - 19 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-8-4",
          frame: 4,
          shot: 1,
          pins_down: 8,
          pins_state: [false, false, false, true, false, false, false, false, false, true],
          is_foul: false,
          is_split: true, // Сплит 4-10
          ball_speed: 1040,
          timestamp: new Date(now.getTime() - 16 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-8-5",
          frame: 4,
          shot: 2,
          pins_down: 1,
          pins_state: [false, false, false, false, false, false, false, false, false, true],
          is_foul: false,
          is_split: false,
          ball_speed: 1020,
          timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-8-6",
          frame: 5,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 950,
          timestamp: new Date(now.getTime() - 13 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-8-7",
          frame: 6,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 930,
          timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-8-8",
          frame: 7,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 960,
          timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-8-9",
          frame: 8,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 940,
          timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: "shot-8-10",
          frame: 9,
          shot: 1,
          pins_down: 10,
          pins_state: [...ALL_DOWN_PINS],
          is_foul: false,
          is_split: false,
          ball_speed: 980,
          timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        },
      ],
    },

    // Дорожки 9, 10, 11: Offline (не отвечают, старый last_seen_at)
    {
      id: 9,
      number: 9,
      name: "Дорожка 9",
      status: "offline",
      is_active: false,
      last_seen_at: oldTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
    },
    {
      id: 10,
      number: 10,
      name: "Дорожка 10",
      status: "offline",
      is_active: false,
      last_seen_at: oldTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
    },
    {
      id: 11,
      number: 11,
      name: "Дорожка 11",
      status: "offline",
      is_active: false,
      last_seen_at: oldTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
    },

    // Дорожка 12: Degraded (ошибки CRC / деградация связи, недавний опрос)
    {
      id: 12,
      number: 12,
      name: "Дорожка 12",
      status: "degraded",
      is_active: false,
      last_seen_at: recentTime,
      options: { ...DEFAULT_OPTIONS },
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
    },
  ];
}

// In-memory состояние мок-данных дорожек
let currentMockLanes: MockLane[] = createInitialMockLanes();

/**
 * Возвращает текущий массив всех 12 мок-дорожек.
 */
export function getMockLanes(): MockLane[] {
  return currentMockLanes;
}

/**
 * Обновляет состояние дорожки по её id.
 * @param id Идентификатор дорожки (1..12)
 * @param patch Поля для частичного обновления
 */
export function updateMockLane(id: number, patch: Partial<MockLane>): void {
  const laneIndex = currentMockLanes.findIndex((l) => l.id === id);
  if (laneIndex !== -1) {
    currentMockLanes[laneIndex] = {
      ...currentMockLanes[laneIndex],
      ...patch,
      options: patch.options
        ? { ...currentMockLanes[laneIndex].options, ...patch.options }
        : currentMockLanes[laneIndex].options,
    };
  }
}

/**
 * Сбрасывает мок-данные к первоначальному эталону (для тестов и сброса среды).
 */
export function resetMockLanes(): void {
  currentMockLanes = createInitialMockLanes();
}
