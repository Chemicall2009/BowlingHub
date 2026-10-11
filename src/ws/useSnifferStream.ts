/**
 * @file src/ws/useSnifferStream.ts
 * @description React-хук для потоковой работы с LCom сниффером через WebSocket.
 */

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { getSnifferSocket } from "./client";
import { parseFrame } from "../lib/lcom";
import type { SnifferFrame, SnifferStatus, SnifferError } from "../api/sniffer";

const MAX_FRAMES = 5000;

class SnifferStreamStore {
  private frames: SnifferFrame[] = [];
  private status: SnifferStatus | null = null;
  private errors: SnifferError[] = [];
  private listeners: Set<() => void> = new Set();
  private isPaused = false;
  private _connected = false;
  private snapshot: {
    frames: SnifferFrame[];
    status: SnifferStatus | null;
    errors: SnifferError[];
    connected: boolean;
    paused: boolean;
  };

  constructor() {
    this.snapshot = { frames: [], status: null, errors: [], connected: false, paused: false };
    const socket = getSnifferSocket();

    socket.onFrame((msg) => {
      this._connected = socket.isConnected;
      const rawBytes = new Uint8Array(
        msg.raw_hex.split(" ").map((b) => parseInt(b, 16))
      );
      const parsed = parseFrame(rawBytes, 0x55);

      const frame: SnifferFrame = {
        id: Math.random().toString(36).substring(2, 11),
        direction: msg.direction,
        timestamp: msg.timestamp,
        raw_hex: msg.raw_hex,
        parsed,
        parse_error: msg.parse_error || (parsed ? null : "Ошибка разбора кадра или CRC"),
        baud: msg.baud,
      };

      if (!this.isPaused) {
        this.frames = [frame, ...this.frames];
        if (this.frames.length > MAX_FRAMES) {
          this.frames = this.frames.slice(0, MAX_FRAMES);
        }
      }
      this.notify();
    });

    socket.onStatus((s) => {
      this._connected = socket.isConnected;
      this.status = {
        transport: s.transport,
        endpoint: s.endpoint,
        baud: s.baud,
        status: s.status,
        dropped_frames: s.dropped_frames,
        total_frames: s.total_frames,
        connected_at: new Date().toISOString(),
      };
      this.notify();
    });

    socket.onError((err) => {
      this.errors = [
        {
          timestamp: new Date().toISOString(),
          code: err.code,
          message: err.message,
          lane_id: err.lane_id,
        },
        ...this.errors,
      ].slice(0, 20);
      this.notify();
    });
  }

  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = () => {
    return this.snapshot;
  };

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    this.notify();
  }

  public clearFrames() {
    this.frames = [];
    this.notify();
  }

  private notify() {
    this.snapshot = {
      frames: this.frames,
      status: this.status,
      errors: this.errors,
      connected: this._connected,
      paused: this.isPaused,
    };
    this.listeners.forEach((l) => l());
  }
}

let streamStoreInstance: SnifferStreamStore | null = null;

function getStreamStore(): SnifferStreamStore {
  if (!streamStoreInstance) {
    streamStoreInstance = new SnifferStreamStore();
  }
  return streamStoreInstance;
}

export function useSnifferStream() {
  const store = useRef(getStreamStore()).current;
  const socket = useRef(getSnifferSocket()).current;

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  const setPaused = useCallback((paused: boolean) => {
    store.setPaused(paused);
  }, [store]);

  const clear = useCallback(() => {
    store.clearFrames();
  }, [store]);

  return {
    frames: state.frames,
    status: state.status,
    errors: state.errors,
    connected: state.connected,
    paused: state.paused,
    setPaused,
    clear,
  };
}
