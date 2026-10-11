/**
 * @file src/lib/format.ts
 * @description Утилиты форматирования для UI боулинг-приложения.
 */

import { format, isToday, parseISO, isYesterday, differenceInMinutes, differenceInHours } from "date-fns";

/** Коэффициент пересчета аппаратных тиков таймера в км/ч (Mendes OVR.EXE) */
const SPEED_CONSTANT_K = 18500;

/**
 * Форматирует номер дорожки в обозначение пары.
 * Для пары дорожек: id=1 → "1-2", id=2 → "1-2", id=3 → "3-4", id=4 → "3-4".
 *
 * @param id Идентификатор или номер дорожки (1..48)
 * @returns Строка вида "1-2", "3-4", "5-6"
 */
export function formatLaneNumber(id: number): string {
  if (id <= 0) return "1-2";
  const pairStart = id % 2 === 1 ? id : id - 1;
  return `${pairStart}-${pairStart + 1}`;
}

/**
 * Форматирует ISO метку времени: "14:32:07" если событие произошло сегодня,
 * иначе "12.10 14:32".
 *
 * @param iso ISO 8601 строка даты/времени
 */
export function formatTimestamp(iso: string): string {
  try {
    const d = parseISO(iso);
    if (isNaN(d.getTime())) return iso;

    if (isToday(d)) {
      return format(d, "HH:mm:ss");
    }
    return format(d, "dd.MM HH:mm");
  } catch {
    return iso;
  }
}

/**
 * Возвращает человекочитаемое относительное время на русском языке:
 * "только что", "2 мин назад", "1 ч назад", "вчера".
 *
 * @param iso ISO 8601 строка даты/времени
 */
export function formatRelativeTime(iso: string): string {
  try {
    const d = parseISO(iso);
    if (isNaN(d.getTime())) return iso;

    const now = new Date();
    const diffMin = differenceInMinutes(now, d);
    const diffHours = differenceInHours(now, d);

    if (diffMin < 1) {
      return "только что";
    }
    if (diffMin < 60) {
      return `${diffMin} мин назад`;
    }
    if (isToday(d)) {
      return `${diffHours} ч назад`;
    }
    if (isYesterday(d)) {
      return "вчера";
    }
    return format(d, "dd.MM.yyyy");
  } catch {
    return iso;
  }
}

/**
 * Пересчитывает тики таймера в скорость шара (км/ч).
 * Формула: V = K / ticks, где K = 18500 (заглушка из OVR.EXE).
 *
 * @param ticks Аппаратные тики таймера между датчиками или null
 * @returns "~18.4 км/ч" или "—" при отсутствии данных
 */
export function formatSpeed(ticks: number | null): string {
  if (ticks === null || ticks <= 0 || isNaN(ticks)) {
    return "—";
  }
  const speedKmh = SPEED_CONSTANT_K / ticks;
  return `~${speedKmh.toFixed(1)} км/ч`;
}

/**
 * Форматирует текущий счёт игры.
 *
 * @param score Набранные очки или null
 * @returns Строка с числом или "—"
 */
export function formatScore(score: number | null): string {
  if (score === null || score === undefined || isNaN(score)) {
    return "—";
  }
  return String(score);
}

/**
 * Форматирует маску состояния кеглей:
 * - "10" если сбиты все 10 кеглей (Strike).
 * - "0" если все 10 кеглей стоят на дорожке.
 * - "1-2-3" (перечисление номеров сбитых кеглей, 1-индексированное).
 *
 * @param pins Массив 10 кеглей (true = стоит, false = сбита)
 */
export function formatPinMask(pins: boolean[]): string {
  if (!pins || pins.length === 0) return "0";

  const knockedDownPinNumbers: number[] = [];
  for (let i = 0; i < pins.length; i++) {
    if (!pins[i]) {
      knockedDownPinNumbers.push(i + 1);
    }
  }

  if (knockedDownPinNumbers.length === pins.length) {
    return "10";
  }
  if (knockedDownPinNumbers.length === 0) {
    return "0";
  }

  return knockedDownPinNumbers.join("-");
}

/**
 * Возвращает соответствующий Tailwind-класс цвета текста для статуса дорожки.
 *
 * @param status Статус дорожки
 * @returns Класс Tailwind: 'text-emerald-500', 'text-red-500' или 'text-amber-500'
 */
export function statusColor(
  status: "online" | "offline" | "degraded"
): string {
  switch (status) {
    case "online":
      return "text-emerald-500";
    case "offline":
      return "text-red-500";
    case "degraded":
      return "text-amber-500";
  }
}
