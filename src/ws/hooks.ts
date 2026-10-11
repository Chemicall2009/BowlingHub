/**
 * @file src/ws/hooks.ts
 * @description React-хуки для подписки на шину событий EventBus с автоматической отпиской.
 */

import { useEffect, useState, useRef } from "react";
import { eventBus } from "./eventBus";
import type { ServerEvent } from "./protocol";
import { useConnectionStore } from "../stores/connection";
import { toast } from "sonner";

/**
 * Хук подписки на события дорожек.
 */
export function useLaneStatusEvents(laneId?: number) {
  const [lastEvent, setLastEvent] = useState<ServerEvent | null>(null);

  useEffect(() => {
    const unsubStatus = eventBus.subscribe("lane.status_changed", (ev) => {
      if (laneId === undefined || ev.lane_id === laneId) {
        setLastEvent(ev);
      }
    });

    const unsubPins = eventBus.subscribe("lane.pins_changed", (ev) => {
      if (laneId === undefined || ev.lane_id === laneId) {
        setLastEvent(ev);
      }
    });

    const unsubOpts = eventBus.subscribe("lane.options_changed", (ev) => {
      if (laneId === undefined || ev.lane_id === laneId) {
        setLastEvent(ev);
      }
    });

    const unsubOffline = eventBus.subscribe("lane.offline", (ev) => {
      if (laneId === undefined || ev.lane_id === laneId) {
        setLastEvent(ev);
      }
    });

    return () => {
      unsubStatus();
      unsubPins();
      unsubOpts();
      unsubOffline();
    };
  }, [laneId]);

  return { lastEvent };
}

/**
 * Хук подписки на игровые события.
 */
export function useGameEvents(gameId?: string) {
  const [lastEvent, setLastEvent] = useState<ServerEvent | null>(null);

  useEffect(() => {
    const unsubCreated = eventBus.subscribe("game.created", (ev) => {
      if (!gameId || ev.game_id === gameId) {
        setLastEvent(ev);
        toast.info(`Создана новая игра на дорожке #${ev.lane_id}`);
      }
    });

    const unsubShot = eventBus.subscribe("game.shot_registered", (ev) => {
      if (!gameId || ev.game_id === gameId) {
        setLastEvent(ev);
      }
    });

    const unsubFinished = eventBus.subscribe("game.finished", (ev) => {
      if (!gameId || ev.game_id === gameId) {
        setLastEvent(ev);
        toast.success("Игра завершена!");
      }
    });

    return () => {
      unsubCreated();
      unsubShot();
      unsubFinished();
    };
  }, [gameId]);

  return { lastEvent };
}

/**
 * Хук подписки на сниффер-кадры.
 */
export function useSnifferEvents() {
  const [frames, setFrames] = useState<any[]>([]);
  const [status, setStatus] = useState<any | null>(null);

  useEffect(() => {
    const unsubFrame = eventBus.subscribe("sniffer.frame", (ev) => {
      setFrames((prev) => [ev.frame, ...prev].slice(0, 5000));
    });

    const unsubStatus = eventBus.subscribe("sniffer.status", (ev) => {
      setStatus(ev.status);
    });

    return () => {
      unsubFrame();
      unsubStatus();
    };
  }, []);

  return { frames, status };
}

/**
 * Хук синхронизации статуса соединения с Zustand стором.
 */
export function useConnectionEvents() {
  const { setConnectionStatus, updateStats } = useConnectionStore();

  useEffect(() => {
    const unsub = eventBus.subscribe("connection.status", (ev) => {
      setConnectionStatus(ev.status);
      updateStats(15, 25, 20);
    });

    return () => {
      unsub();
    };
  }, [setConnectionStatus, updateStats]);
}

/**
 * Хук обработки глобальных ошибок с дедупликацией тостов.
 */
export function useErrorEvents() {
  const lastErrorRef = useRef<{ key: string; time: number }>({ key: "", time: 0 });

  useEffect(() => {
    const unsub = eventBus.subscribe("error", (ev) => {
      const key = `${ev.code}:${ev.message}`;
      const now = Date.now();

      if (lastErrorRef.current.key === key && now - lastErrorRef.current.time < 5000) {
        return; // дедупликация в течение 5с
      }

      lastErrorRef.current = { key, time: now };
      toast.error(`[${ev.code}] ${ev.message}`);
    });

    return () => {
      unsub();
    };
  }, []);
}
