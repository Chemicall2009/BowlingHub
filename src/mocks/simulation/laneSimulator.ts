/**
 * @file src/mocks/simulation/laneSimulator.ts
 * @description Симулятор одной дорожки боулинга с генерацией бросков, расчетом очков и управлением состоянием.
 */

import { getMockLanes, updateMockLane, type MockShot } from "../data/lanes";
import { gamesStore, type MockGame } from "../handlers/games";
import { useOperationMode } from "../../stores/operationMode";
import { computeScoreboard, calculateCurrentTotal } from "./scoring";
import { DEFAULT_SIM_CONFIG, type SimConfig, type SimLaneState } from "./types";
import type { FrameScore, PlayerScore } from "../../api/types";

const NAMES_POOL = [
  "Алексей",
  "Мария",
  "Дмитрий",
  "Ольга",
  "Иван",
  "Екатерина",
  "Сергей",
  "Анна",
  "Николай",
  "Татьяна",
];

const ALL_STANDING_PINS: boolean[] = [
  true, true, true, true, true,
  true, true, true, true, true,
];

function createBlankFrames(): FrameScore[] {
  return Array.from({ length: 10 }, (_, i) => ({
    frame: i + 1,
    rolls: [],
    score: null,
  }));
}

export class LaneSimulator {
  readonly lane_id: number;
  private config: SimConfig;
  private running = false;
  private paused = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private last_throw_at = 0;
  private throw_count = 0;
  private isThrowInProgress = false;

  constructor(lane_id: number, config: SimConfig = DEFAULT_SIM_CONFIG) {
    this.lane_id = lane_id;
    this.config = { ...config };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;

    // Сразу делаем первый бросок при старте через 800мс
    setTimeout(() => {
      if (this.running && !this.paused) {
        this.doThrow();
      }
    }, 800);

    this.timer = setInterval(() => {
      if (!this.paused && this.running) {
        this.doThrow();
      }
    }, this.config.throw_interval_ms);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  updateConfig(cfg: Partial<SimConfig>): void {
    this.config = { ...this.config, ...cfg };
    if (this.running && this.timer && cfg.throw_interval_ms) {
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (!this.paused && this.running) {
          this.doThrow();
        }
      }, this.config.throw_interval_ms);
    }
  }

  throwNow(): void {
    if (useOperationMode.getState().mode !== "emulation") return;
    this.doThrow();
  }

  reset(): void {
    const lane = getMockLanes().find((l) => l.id === this.lane_id);
    if (!lane) return;

    if (lane.current_game?.id) {
      gamesStore.delete(lane.current_game.id);
    }

    updateMockLane(this.lane_id, {
      pins: [...ALL_STANDING_PINS],
      foul1: false,
      foul2: false,
      split: false,
      speed: null,
      current_game: null,
      shots: [],
      status: "online",
      is_active: false,
      last_seen_at: new Date().toISOString(),
    });
  }

  getState(): SimLaneState {
    return {
      lane_id: this.lane_id,
      running: this.running,
      paused: this.paused,
      timer: this.timer,
      last_throw_at: this.last_throw_at,
      throw_count: this.throw_count,
    };
  }

  private doThrow(): void {
    if (useOperationMode.getState().mode !== "emulation") {
      this.stop();
      return;
    }

    if (this.isThrowInProgress) return;
    this.isThrowInProgress = true;

    let lane = getMockLanes().find((l) => l.id === this.lane_id);
    if (!lane) {
      this.isThrowInProgress = false;
      return;
    }

    // Проверяем / создаем активную игру
    let game: MockGame | undefined;
    
    // Если current_game отсутствует, инициализируем новую игру
    if (!lane.current_game) {
      game = this.createNewGame(['Алексей', 'Мария']);
      lane = getMockLanes().find((l) => l.id === this.lane_id);
      if (lane) {
         // Explicit assignment as requested
         lane.current_game = {
            id: game.id,
            player_name: game.current_player,
            score: game.score,
            current_frame: game.current_frame ?? 1,
         };
      }
    } else {
      const gameId = lane.current_game.id;
      game = gamesStore.get(gameId);
      
      // Если игра завершена или повреждена, создаем новую
      if (!game || game.status === "completed" || !game.players || game.players.length === 0) {
        game = this.createNewGame();
        lane = getMockLanes().find((l) => l.id === this.lane_id);
      }
    }

    if (!lane || !game) {
      this.isThrowInProgress = false;
      return;
    }

    const currentPIdx = game.current_player_index ?? 0;
    const activePlayer = game.players[currentPIdx] || game.players[0];
    const currentFrameNum = game.current_frame ?? 1;
    const currentFrame = activePlayer.frames[currentFrameNum - 1];

    const isNewFrameFirstShot = currentFrame.rolls.length === 0;

    // Если это первый бросок в фрейме — подготавливаем дорожку (сбрасываем кегли в standing)
    if (isNewFrameFirstShot) {
      updateMockLane(this.lane_id, {
        pins: [...ALL_STANDING_PINS],
        foul1: false,
        foul2: false,
        split: false,
        speed: null,
      });

      // Небольшая задержка 400мс, чтобы TV-панель успела отрисовать поднятые кегли
      setTimeout(() => {
        this.performThrow(game!, activePlayer, currentFrameNum);
        this.isThrowInProgress = false;
      }, 400);
    } else {
      // Второй или третий бросок — производим бросок сразу
      this.performThrow(game, activePlayer, currentFrameNum);
      this.isThrowInProgress = false;
    }
  }

  private createNewGame(names?: string[]): MockGame {
    const gameId = `sim-game-${this.lane_id}-${Date.now()}`;
    let chosenNames: string[];
    
    if (names && names.length > 0) {
      chosenNames = names;
    } else {
      const shuffled = [...NAMES_POOL].sort(() => 0.5 - Math.random());
      const count = Math.min(this.config.players_per_game, NAMES_POOL.length);
      chosenNames = shuffled.slice(0, count);
    }

    const players: PlayerScore[] = chosenNames.map((name, idx) => ({
      id: `sim-p-${this.lane_id}-${idx + 1}`,
      name,
      is_current: idx === 0,
      total_score: 0,
      frames: createBlankFrames(),
    }));

    const newGame: MockGame = {
      id: gameId,
      lane_id: this.lane_id,
      players,
      current_player: players[0].name,
      current_player_index: 0,
      frame: 1,
      current_frame: 1,
      score: 0,
      status: "active",
      started_at: new Date().toISOString(),
    };

    gamesStore.set(gameId, newGame);

    updateMockLane(this.lane_id, {
      pins: [...ALL_STANDING_PINS],
      status: "online",
      is_active: true,
      current_game: {
        id: gameId,
        player_name: players[0].name,
        score: 0,
        current_frame: 1,
      },
      last_seen_at: new Date().toISOString(),
    });

    return newGame;
  }

  private performThrow(
    game: MockGame,
    player: PlayerScore,
    frameNum: number
  ): void {
    const lane = getMockLanes().find((l) => l.id === this.lane_id);
    if (!lane) return;

    const frameObj = player.frames[frameNum - 1];
    const rollIndex = frameObj.rolls.length; // 0, 1 или 2 (в 10-м)

    // Текущие стоящие кегли
    const currentPins = [...lane.pins];
    const standingCount = currentPins.filter(Boolean).length;

    // Определяем сбитые кегли
    let pinsToKnock = 0;
    const isFirstShotInFrame = rollIndex === 0;

    if (isFirstShotInFrame || standingCount === 10) {
      // Первый бросок
      const isStrike = Math.random() < this.config.strike_probability;
      if (isStrike) {
        pinsToKnock = 10;
      } else {
        const rnd = Math.random();
        if (rnd < 0.5) {
          pinsToKnock = 6 + Math.floor(Math.random() * 4); // 6..9
        } else if (rnd < 0.8) {
          pinsToKnock = 1 + Math.floor(Math.random() * 5); // 1..5
        } else {
          pinsToKnock = 0; // Gutter ball
        }
      }
    } else {
      // Второй бросок по оставшимся
      const isSpare = Math.random() < this.config.spare_probability;
      if (isSpare) {
        pinsToKnock = standingCount;
      } else {
        pinsToKnock = Math.floor(Math.random() * standingCount);
      }
    }

    const isFoul = Math.random() < this.config.foul_probability;

    // Сбиваем кегли физически в массиве
    const newPins = [...currentPins];
    if (pinsToKnock === 10 && standingCount === 10) {
      newPins.fill(false);
    } else if (pinsToKnock > 0) {
      // Выбираем случайные стоящие кегли для падения
      const standingIndices: number[] = [];
      newPins.forEach((isStanding, idx) => {
        if (isStanding) standingIndices.push(idx);
      });
      // Перемешиваем индексы
      standingIndices.sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(pinsToKnock, standingIndices.length); i++) {
        newPins[standingIndices[i]] = false;
      }
    }

    // Скорость броска
    const speed = this.config.realistic_speed
      ? parseFloat((17.5 + Math.random() * 7).toFixed(1))
      : null;

    // Символ броска
    let rollSymbol: number | "X" | "/" | "F" | "-";
    if (isFoul) {
      rollSymbol = "F";
    } else if (frameNum < 10) {
      if (isFirstShotInFrame && pinsToKnock === 10) {
        rollSymbol = "X";
      } else if (!isFirstShotInFrame && pinsToKnock === standingCount && standingCount > 0) {
        rollSymbol = "/";
      } else if (pinsToKnock === 0) {
        rollSymbol = "-";
      } else {
        rollSymbol = pinsToKnock;
      }
    } else {
      // 10-й фрейм
      if (pinsToKnock === 10 && (standingCount === 10 || isFirstShotInFrame)) {
        rollSymbol = "X";
      } else if (rollIndex > 0 && pinsToKnock === standingCount && standingCount > 0) {
        rollSymbol = "/";
      } else if (pinsToKnock === 0) {
        rollSymbol = "-";
      } else {
        rollSymbol = pinsToKnock;
      }
    }

    frameObj.rolls.push(rollSymbol);

    // Сплит индикация (если первый бросок оставил 2+ удаленные кегли)
    const isSplit =
      !isFoul &&
      isFirstShotInFrame &&
      pinsToKnock >= 6 &&
      pinsToKnock <= 8 &&
      Math.random() < 0.35;

    // Пересчет таблицы очков
    player.frames = computeScoreboard(player.frames);
    player.total_score = calculateCurrentTotal(player.frames);

    game.score = player.total_score;

    // Сохраняем бросок в историю
    const shotRecord: MockShot = {
      id: `sim-shot-${this.lane_id}-${Date.now()}`,
      frame: frameNum,
      shot: rollIndex + 1,
      pins_down: isFoul ? 0 : pinsToKnock,
      pins_state: newPins,
      is_foul: isFoul,
      is_split: isSplit,
      ball_speed: speed ? Math.round(speed * 100) : null,
      timestamp: new Date().toISOString(),
    };

    lane.shots = [shotRecord, ...lane.shots.slice(0, 49)];

    // Логика перехода хода
    let isFrameCompletedForPlayer = false;

    if (frameNum < 10) {
      if (rollSymbol === "X" || frameObj.rolls.length >= 2) {
        isFrameCompletedForPlayer = true;
      }
    } else {
      // 10-й фрейм
      const hasBonus =
        frameObj.rolls.includes("X") || frameObj.rolls.includes("/");
      if (hasBonus) {
        if (frameObj.rolls.length >= 3) {
          isFrameCompletedForPlayer = true;
        }
      } else {
        if (frameObj.rolls.length >= 2) {
          isFrameCompletedForPlayer = true;
        }
      }
    }

    if (isFrameCompletedForPlayer) {
      // Переход к следующему игроку
      const nextPIdx = (game.current_player_index ?? 0) + 1;
      if (nextPIdx < game.players.length) {
        game.current_player_index = nextPIdx;
        game.current_player = game.players[nextPIdx].name;
        game.players.forEach((p, idx) => {
          p.is_current = idx === nextPIdx;
        });
      } else {
        // Все игроки завершили текущий фрейм -> переход к следующему фрейму
        game.current_player_index = 0;
        game.current_player = game.players[0].name;
        game.players.forEach((p, idx) => {
          p.is_current = idx === 0;
        });

        if (frameNum < 10) {
          game.frame = frameNum + 1;
          game.current_frame = frameNum + 1;
        } else {
          // Игра завершена!
          game.status = "completed";
        }
      }
    }

    this.last_throw_at = Date.now();
    this.throw_count += 1;

    // Обновляем состояние дорожки
    updateMockLane(this.lane_id, {
      pins: newPins,
      foul1: isFoul,
      split: isSplit,
      speed: speed,
      status: "online",
      is_active: true,
      current_game: {
        id: game.id,
        player_name: game.current_player,
        score: game.score,
        current_frame: game.current_frame ?? 1,
      },
      last_seen_at: new Date().toISOString(),
    });

    // Если фрейм завершился или был страйк — подготавливаем сброс кеглей через паузу (3 сек)
    if (isFrameCompletedForPlayer && game.status !== "completed") {
      setTimeout(() => {
        const curL = getMockLanes().find((l) => l.id === this.lane_id);
        if (curL && curL.current_game?.id === game.id) {
          updateMockLane(this.lane_id, {
            pins: [...ALL_STANDING_PINS],
            foul1: false,
            split: false,
            speed: null,
          });
        }
      }, 3000);
    }
  }
}
