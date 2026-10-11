/**
 * @file src/providers/WebSocketProvider.tsx
 * @description Единый WebSocket-провайдер для всех real-time событий приложения с heartbeat, reconnect и EventBus.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { eventBus } from "../ws/eventBus";
import { parseServerEvent } from "../ws/schema";
import { getMockSniffer } from "../ws/mockSniffer";

type ConnectionStatus = "connecting" | "open" | "closed" | "error";

interface WebSocketContextValue {
  status: ConnectionStatus;
  reconnectAttempts: number;
  lastError: string | null;
  send: (data: unknown) => void;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  status: "closed",
  reconnectAttempts: 0,
  lastError: null,
  send: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const pongTimeoutRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);

  const isMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_WS !== "false";

  const send = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;
    setStatus("connecting");

    if (isMock) {
      // Mock WS integration via MockSnifferSocket
      setStatus("open");
      setReconnectAttempts(0);
      const mock = getMockSniffer();

      const handleMsg = (event: { data: string }) => {
        try {
          const parsed = JSON.parse(event.data);
          // Если это фрейм сниффера от мока, смаппим в ServerEvent
          if (parsed.type === "frame") {
            eventBus.emit({
              type: "sniffer.frame",
              frame: {
                id: Math.random().toString(36).substring(2, 9),
                direction: parsed.direction,
                timestamp: parsed.timestamp,
                raw_hex: parsed.raw_hex,
                parsed: null,
                parse_error: parsed.parse_error,
                baud: parsed.baud,
              },
              timestamp: parsed.timestamp,
            });
          } else if (parsed.type === "status") {
            eventBus.emit({
              type: "sniffer.status",
              status: {
                transport: parsed.transport,
                endpoint: parsed.endpoint,
                baud: parsed.baud,
                status: parsed.status,
                dropped_frames: parsed.dropped_frames,
                total_frames: parsed.total_frames,
                connected_at: new Date().toISOString(),
              },
              timestamp: new Date().toISOString(),
            });
          } else {
            const ev = parseServerEvent(parsed);
            if (ev) eventBus.emit(ev);
          }
        } catch {
          // ignore
        }
      };

      mock.onmessage = handleMsg;
      return;
    }

    // Production real WebSocket
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) return;
        setStatus("open");
        setReconnectAttempts(0);
        setLastError(null);

        // Start heartbeat ping/pong in prod
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping", timestamp: new Date().toISOString() }));
            
            if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
            pongTimeoutRef.current = window.setTimeout(() => {
              // No pong received in 10s -> force reconnect
              socket.close();
            }, 10000);
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const raw = JSON.parse(event.data);
          if (raw.type === "pong") {
            if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
            return;
          }
          const eventObj = parseServerEvent(raw);
          if (eventObj) {
            eventBus.emit(eventObj);
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error("[WebSocket] Failed to parse message:", err);
          }
        }
      };

      socket.onclose = () => {
        if (isUnmountedRef.current) return;
        setStatus("closed");
        cleanupTimers();
        attemptReconnect();
      };

      socket.onerror = (err) => {
        if (isUnmountedRef.current) return;
        setStatus("error");
        setLastError("Ошибка соединения с WebSocket сервером");
      };
    } catch (err: any) {
      setStatus("error");
      setLastError(err?.message || "Не удалось инициализировать WebSocket");
      attemptReconnect();
    }
  }, [isMock]);

  const cleanupTimers = () => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
  };

  const attemptReconnect = useCallback(() => {
    if (isUnmountedRef.current || isMock) return;

    setReconnectAttempts((prev) => {
      if (prev >= 10) return prev;
      const nextAttempt = prev + 1;
      const delay = Math.min(1000 * Math.pow(2, prev), 30000);

      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, delay);

      return nextAttempt;
    });
  }, [connect, isMock]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      cleanupTimers();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ status, reconnectAttempts, lastError, send }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
