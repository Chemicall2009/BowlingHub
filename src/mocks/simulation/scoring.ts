/**
 * @file src/mocks/simulation/scoring.ts
 * @description Модуль подсчёта очков в боулинге по классическим правилам (10 фреймов, страйки, спэры, 10-й фрейм).
 */

import type { FrameScore } from "../../api/types";

/**
 * Преобразует строковое или числовое значение броска в число сбитых кеглей.
 */
export function getRollValue(
  roll: number | "X" | "/" | "F" | "-" | null | undefined,
  prevRollInFrame?: number | "X" | "/" | "F" | "-" | null
): number {
  if (roll === null || roll === undefined) return 0;
  if (roll === "X") return 10;
  if (roll === "F" || roll === "-") return 0;
  if (roll === "/") {
    const prevVal = typeof prevRollInFrame === "number" ? prevRollInFrame : 0;
    return Math.max(0, 10 - prevVal);
  }
  return typeof roll === "number" ? roll : 0;
}

/**
 * Пересчитывает накопительный счет (cumulative score) по всем 10 фреймам.
 */
export function computeScoreboard(frames: FrameScore[]): FrameScore[] {
  // Копируем фреймы
  const updatedFrames: FrameScore[] = frames.map((f) => ({
    ...f,
    rolls: [...f.rolls],
    score: null,
  }));

  let runningTotal = 0;

  for (let i = 0; i < updatedFrames.length; i++) {
    const frameObj = updatedFrames[i];
    const frameNum = frameObj.frame;
    const rolls = frameObj.rolls;

    if (rolls.length === 0) {
      frameObj.score = null;
      continue;
    }

    if (frameNum < 10) {
      // Фреймы 1..9
      const firstRoll = rolls[0];
      const isStrike = firstRoll === "X";
      const isSpare = rolls.length > 1 && rolls[1] === "/";

      if (isStrike) {
        // Требуются 2 следующих броска для начисления бонуса
        const nextTwo = getNextTwoRolls(updatedFrames, i);
        if (nextTwo !== null) {
          runningTotal += 10 + nextTwo[0] + nextTwo[1];
          frameObj.score = runningTotal;
        } else {
          frameObj.score = null;
        }
      } else if (isSpare) {
        // Требуется 1 следующий бросок для начисления бонуса
        const nextOne = getNextOneRoll(updatedFrames, i);
        if (nextOne !== null) {
          runningTotal += 10 + nextOne;
          frameObj.score = runningTotal;
        } else {
          frameObj.score = null;
        }
      } else if (rolls.length >= 2) {
        // Открытый завершенный фрейм
        const val1 = getRollValue(rolls[0]);
        const val2 = getRollValue(rolls[1], rolls[0]);
        runningTotal += val1 + val2;
        frameObj.score = runningTotal;
      } else {
        // Фрейм еще не завершен (сделан только 1 бросок не-страйк)
        frameObj.score = null;
      }
    } else {
      // 10-й фрейм
      if (rolls.length > 0) {
        let frame10Sum = 0;
        for (let rIdx = 0; rIdx < rolls.length; rIdx++) {
          const prevRoll = rIdx > 0 ? rolls[rIdx - 1] : undefined;
          frame10Sum += getRollValue(rolls[rIdx], prevRoll);
        }
        runningTotal += frame10Sum;
        frameObj.score = runningTotal;
      }
    }
  }

  return updatedFrames;
}

/**
 * Находит числовые значения следующих двух бросков после фрейма с индексом frameIdx.
 */
function getNextTwoRolls(
  frames: FrameScore[],
  frameIdx: number
): [number, number] | null {
  const futureRolls: number[] = [];

  for (let i = frameIdx + 1; i < frames.length; i++) {
    const f = frames[i];
    for (let r = 0; r < f.rolls.length; r++) {
      const prev = r > 0 ? f.rolls[r - 1] : undefined;
      futureRolls.push(getRollValue(f.rolls[r], prev));
      if (futureRolls.length === 2) {
        return [futureRolls[0], futureRolls[1]];
      }
    }
  }

  return null;
}

/**
 * Находит числовое значение следующего одного броска после фрейма с индексом frameIdx.
 */
function getNextOneRoll(
  frames: FrameScore[],
  frameIdx: number
): number | null {
  for (let i = frameIdx + 1; i < frames.length; i++) {
    const f = frames[i];
    if (f.rolls.length > 0) {
      return getRollValue(f.rolls[0]);
    }
  }
  return null;
}

/**
 * Вычисляет суммарный счет игрока на данный момент (включая частичные броски).
 */
export function calculateCurrentTotal(frames: FrameScore[]): number {
  let total = 0;
  for (const f of frames) {
    if (f.score !== null) {
      total = f.score;
    }
  }
  // Если ни один фрейм не закрыт бонусом, но броски уже были:
  if (total === 0) {
    for (const f of frames) {
      for (let r = 0; r < f.rolls.length; r++) {
        const prev = r > 0 ? f.rolls[r - 1] : undefined;
        total += getRollValue(f.rolls[r], prev);
      }
    }
  }
  return total;
}
