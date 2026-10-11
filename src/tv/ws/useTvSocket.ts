/**
 * @file src/tv/ws/useTvSocket.ts
 * @description WebSocket hook for TV display connecting to /ws/tv/{laneId}.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { TvSnapshot, TvEvent } from "../types";

export function useTvSocket(laneId: number) {
  const [isConnected, setIsConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<TvSnapshot | null>(null);
  const [lastEvent, setLastEvent] = useState<TvEvent | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!laneId) return;
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
    const url = `${wsUrl.replace(/\/$/, "")}/ws/tv/${laneId}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TvEvent;
        if (data.type === "tv.snapshot") {
          setSnapshot(data as TvSnapshot);
        } else {
          setLastEvent(data);
          // Update snapshot state incrementally based on event if needed
          setSnapshot((prev) => {
            if (!prev) return prev;
            if (data.type === "tv.pins_changed") {
              return {
                ...prev,
                pins: data.pins,
                foul1: data.foul1,
                foul2: data.foul2,
                split: data.split,
                speed_kmh: data.speed_kmh,
              };
            }
            if (data.type === "tv.player_changed") {
              return {
                ...prev,
                current_game: prev.current_game
                  ? { ...prev.current_game, player_name: data.player_name }
                  : null,
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Failed to parse TV WS message:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Exponential backoff reconnect: 1, 2, 4, 8, 16, 30 sec
      setReconnectAttempts((attempts) => {
        const nextAttempt = attempts + 1;
        const delay = Math.min(Math.pow(2, attempts) * 1000, 30000);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
        return nextAttempt;
      });
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [laneId]);

  useEffect(() => {
    connect();

    // Heartbeat ping every 30 sec
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    state: { isConnected },
    snapshot,
    lastEvent,
    reconnectAttempts,
  };
}
