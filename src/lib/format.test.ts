/**
 * @file src/lib/format.test.ts
 * @description Юнит-тесты утилит форматирования (format.ts).
 */

import { describe, it, expect } from "vitest";
import {
  formatLaneNumber,
  formatTimestamp,
  formatRelativeTime,
  formatSpeed,
  formatScore,
  formatPinMask,
  statusColor,
} from "./format";

describe("UI Formatters: formatLaneNumber", () => {
  it("возвращает корректную пару дорожек для нечетных и четных ID", () => {
    expect(formatLaneNumber(1)).toBe("1-2");
    expect(formatLaneNumber(2)).toBe("1-2");
    expect(formatLaneNumber(3)).toBe("3-4");
    expect(formatLaneNumber(4)).toBe("3-4");
    expect(formatLaneNumber(5)).toBe("5-6");
    expect(formatLaneNumber(6)).toBe("5-6");
    expect(formatLaneNumber(11)).toBe("11-12");
    expect(formatLaneNumber(12)).toBe("11-12");
  });
});

describe("UI Formatters: formatTimestamp & formatRelativeTime", () => {
  it("форматирует метку сегодняшнего дня как HH:mm:ss", () => {
    const todayIso = new Date().toISOString();
    const formatted = formatTimestamp(todayIso);
    expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("форматирует вчерашнюю метку или более раннюю с днем и месяцем", () => {
    const pastDate = new Date(2025, 9, 12, 14, 32); // 12.10
    const formatted = formatTimestamp(pastDate.toISOString());
    expect(formatted).toContain("12.10");
  });

  it("formatRelativeTime возвращает 'только что' для недавнего времени", () => {
    const justNow = new Date().toISOString();
    expect(formatRelativeTime(justNow)).toBe("только что");
  });

  it("formatRelativeTime возвращает минуты назад", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5 мин назад");
  });
});

describe("UI Formatters: formatSpeed", () => {
  it("рассчитывает скорость по формуле 18500 / ticks", () => {
    // 18500 / 1000 = 18.5
    expect(formatSpeed(1000)).toBe("~18.5 км/ч");
  });

  it("возвращает '—' для null, 0 или отрицательных тиков", () => {
    expect(formatSpeed(null)).toBe("—");
    expect(formatSpeed(0)).toBe("—");
    expect(formatSpeed(-10)).toBe("—");
  });
});

describe("UI Formatters: formatScore", () => {
  it("возвращает строку очков или '—' при null", () => {
    expect(formatScore(187)).toBe("187");
    expect(formatScore(0)).toBe("0");
    expect(formatScore(null)).toBe("—");
  });
});

describe("UI Formatters: formatPinMask", () => {
  it("возвращает '0' если все кегли стоят", () => {
    const allStanding = new Array(10).fill(true);
    expect(formatPinMask(allStanding)).toBe("0");
  });

  it("возвращает '10' если все кегли сбиты (Strike)", () => {
    const allDown = new Array(10).fill(false);
    expect(formatPinMask(allDown)).toBe("10");
  });

  it("возвращает перечисление сбитых кеглей", () => {
    // Сбиты кегли 1, 2, 3 (индексы 0, 1, 2 = false)
    const pins = [false, false, false, true, true, true, true, true, true, true];
    expect(formatPinMask(pins)).toBe("1-2-3");

    // Сплит 7 и 10 (индексы 6 и 9 = false)
    const splitPins = [true, true, true, true, true, true, false, true, true, false];
    expect(formatPinMask(splitPins)).toBe("7-10");
  });
});

describe("UI Formatters: statusColor", () => {
  it("возвращает соответствующие Tailwind классы", () => {
    expect(statusColor("online")).toBe("text-emerald-500");
    expect(statusColor("offline")).toBe("text-red-500");
    expect(statusColor("degraded")).toBe("text-amber-500");
  });
});
