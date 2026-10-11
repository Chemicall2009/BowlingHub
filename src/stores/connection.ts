/**
 * @file src/stores/connection.ts
 * @description Zustand-стор статуса подключения к аппаратному транспорту (RS-485/TCP/Mock).
 */

import { create } from "zustand";

export type ConnectionMode = "serial" | "tcp" | "mock";
export type ConnectionStatus = "connected" | "connecting" | "degraded" | "disconnected";

export interface ConnectionState {
  mode: ConnectionMode;
  endpoint: string;
  baud: number;
  status: ConnectionStatus;
  lastPingMs: number;
  rxPacketsSec: number;
  txPacketsSec: number;

  setMode: (mode: ConnectionMode) => void;
  setStatus: (status: ConnectionStatus) => void;
  setConnectionStatus: (status: ConnectionStatus | "online" | "offline") => void;
  setBaud: (baud: number) => void;
  setEndpoint: (endpoint: string) => void;
  setTransportDetails: (
    transportOrObj:
      | string
      | {
          transport: string;
          port?: string;
          baudRate?: number;
          host?: string;
          tcpPort?: number;
        },
    endpoint?: string,
    baud?: number
  ) => void;
  updateStats: (ping: number, rx: number, tx: number) => void;
  getDisplayString: () => string;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  mode: "serial",
  endpoint: "/dev/ttyUSB0",
  baud: 19200,
  status: "connected",
  lastPingMs: 14,
  rxPacketsSec: 24,
  txPacketsSec: 18,

  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  setConnectionStatus: (status) => {
    let resolvedStatus: ConnectionStatus = "connected";
    if (status === "online" || status === "connected") resolvedStatus = "connected";
    else if (status === "offline" || status === "disconnected") resolvedStatus = "disconnected";
    else if (status === "degraded") resolvedStatus = "degraded";
    else if (status === "connecting") resolvedStatus = "connecting";
    set({ status: resolvedStatus });
  },
  setBaud: (baud) => set({ baud }),
  setEndpoint: (endpoint) => set({ endpoint }),
  setTransportDetails: (transportOrObj, endpoint, baud) => {
    if (typeof transportOrObj === "object" && transportOrObj !== null) {
      const isTcp = transportOrObj.transport === "tcp";
      const isMock = transportOrObj.transport === "mock";
      const validMode: ConnectionMode = isTcp ? "tcp" : isMock ? "mock" : "serial";
      set({
        mode: validMode,
        endpoint: isTcp
          ? `${transportOrObj.host || "192.168.4.1"}:${transportOrObj.tcpPort || 2323}`
          : transportOrObj.port || "/dev/ttyUSB0",
        baud: transportOrObj.baudRate || 19200,
      });
      return;
    }

    const validMode: ConnectionMode =
      transportOrObj === "tcp" ? "tcp" : transportOrObj === "mock" ? "mock" : "serial";
    set({
      mode: validMode,
      endpoint: endpoint || (validMode === "tcp" ? "192.168.4.1:2323" : "/dev/ttyUSB0"),
      baud: baud || 19200,
    });
  },
  updateStats: (ping, rx, tx) =>
    set({
      lastPingMs: ping,
      rxPacketsSec: rx,
      txPacketsSec: tx,
    }),

  getDisplayString: () => {
    const s = get();
    if (s.mode === "serial") {
      return `Serial ${s.endpoint} @ ${s.baud}`;
    }
    if (s.mode === "tcp") {
      return `TCP ${s.endpoint}`;
    }
    return "Mock LCom Bus (RS-485)";
  },
}));
