/**
 * @file src/ws/client.ts
 * @description WebSocket клиент для LCom сниффера с автопереподключением и поддержкой mock-режима.
 */

import { getMockSniffer, MockSnifferSocket, type MockWsMessage } from "./mockSniffer";

type FrameCallback = (msg: Extract<MockWsMessage, { type: "frame" }>) => void;
type StatusCallback = (msg: Extract<MockWsMessage, { type: "status" }>) => void;
type ErrorCallback = (msg: Extract<MockWsMessage, { type: "error" }>) => void;
type GenericEventCallback = (...args: any[]) => void;

export class SnifferSocket {
  private ws: WebSocket | MockSnifferSocket | null = null;
  private frameCallbacks: FrameCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private genericListeners: Map<string, GenericEventCallback[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: number | null = null;
  private _isConnected = false;
  private isExplicitlyClosed = false;
  private heartbeatInterval: number | null = null;

  public get isConnected(): boolean {
    return this._isConnected;
  }

  public isConnectedFn(): boolean {
    return this._isConnected;
  }

  public connect(_url?: string) {
    this.isExplicitlyClosed = false;
    if (this._isConnected) return;

    const isDev = import.meta.env.DEV;

    if (isDev) {
      const mock = getMockSniffer();
      this.ws = mock;
      this._isConnected = true;
      this.reconnectAttempts = 0;

      mock.onopen = () => {
        this._isConnected = true;
      };

      mock.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as MockWsMessage;
          this.handleMessage(data);
        } catch {
          // ignore
        }
      };

      mock.onclose = () => {
        this._isConnected = false;
      };

      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = window.setInterval(() => {
        const listeners = this.genericListeners.get("heartbeat");
        if (listeners) {
          listeners.forEach((cb) => cb());
        }
      }, 2000);

      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/sniffer`;

    try {
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        this._isConnected = true;
        this.reconnectAttempts = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as MockWsMessage;
          this.handleMessage(data);
        } catch {
          // ignore
        }
      };

      socket.onclose = () => {
        this._isConnected = false;
        this.ws = null;
        if (!this.isExplicitlyClosed) {
          this.attemptReconnect();
        }
      };

      socket.onerror = () => {};
    } catch {
      this._isConnected = false;
      if (!this.isExplicitlyClosed) {
        this.attemptReconnect();
      }
    }
  }

  private handleMessage(data: MockWsMessage) {
    if (data.type === "frame") {
      this.frameCallbacks.forEach((cb) => cb(data));
    } else if (data.type === "status") {
      this.statusCallbacks.forEach((cb) => cb(data));
    } else if (data.type === "error") {
      this.errorCallbacks.forEach((cb) => cb(data));
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isExplicitlyClosed) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.ws) {
      if (typeof (this.ws as any).close === "function") {
        (this.ws as any).close();
      }
      this.ws = null;
    }
    this._isConnected = false;
  }

  public onFrame(cb: FrameCallback) {
    this.frameCallbacks.push(cb);
    return () => {
      this.frameCallbacks = this.frameCallbacks.filter((item) => item !== cb);
    };
  }

  public onStatus(cb: StatusCallback) {
    this.statusCallbacks.push(cb);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter((item) => item !== cb);
    };
  }

  public onError(cb: ErrorCallback) {
    this.errorCallbacks.push(cb);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((item) => item !== cb);
    };
  }

  public on(event: string, cb: GenericEventCallback) {
    if (!this.genericListeners.has(event)) {
      this.genericListeners.set(event, []);
    }
    this.genericListeners.get(event)!.push(cb);
    return () => {
      const list = this.genericListeners.get(event);
      if (list) {
        this.genericListeners.set(
          event,
          list.filter((item) => item !== cb)
        );
      }
    };
  }

  public send(data: unknown) {
    if (this.ws && typeof (this.ws as any).send === "function") {
      try {
        (this.ws as any).send(JSON.stringify(data));
      } catch {
        // ignore
      }
    }
  }
}

let globalClient: SnifferSocket | null = null;

export function getSnifferSocket(): SnifferSocket {
  if (!globalClient) {
    globalClient = new SnifferSocket();
  }
  return globalClient;
}

export const wsClient = getSnifferSocket();
