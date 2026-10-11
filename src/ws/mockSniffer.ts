/**
 * @file src/ws/mockSniffer.ts
 * @description Mock WebSocket эмулятор для LCom сниффера (разработка фронта без бэкенда).
 */

import { buildFrame, CMD_POLL_STATUS, CMD_STATUS_OK, CMD_RESET_LANE } from "../lib/lcom";

export type MockWsMessage =
  | {
      type: "frame";
      direction: "rx" | "tx";
      timestamp: string;
      raw_hex: string;
      lane_id: number | null;
      checksum_ok: boolean | null;
      parse_error: string | null;
      baud: number;
    }
  | {
      type: "status";
      transport: "serial" | "tcp" | "mock";
      endpoint: string;
      baud: number;
      status: "online" | "degraded" | "offline";
      dropped_frames: number;
      total_frames: number;
    }
  | {
      type: "error";
      message: string;
      code: string;
      lane_id: number | null;
    };

export class MockSnifferSocket {
  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  private timerId: number | null = null;
  private statusTimerId: number | null = null;
  private errorTimerId: number | null = null;
  private heartbeatTimerId: number | null = null;
  private isClosed = false;
  private totalFrames = 0;
  private droppedFrames = 0;

  constructor() {
    setTimeout(() => {
      if (!this.isClosed && this.onopen) {
        this.onopen();
      }
      this.startEmitting();
    }, 50);
  }

  private startEmitting() {
    const emitFrame = () => {
      if (this.isClosed) return;

      const rand = Math.random();
      let cmd = CMD_POLL_STATUS;
      const laneId = Math.floor(Math.random() * 24) + 1;
      const direction: "rx" | "tx" = Math.random() > 0.4 ? "rx" : "tx";
      const baud = 9600;

      let rawBytes: Uint8Array;
      let checksumOk: boolean | null = true;
      let parseError: string | null = null;

      if (rand < 0.6) {
        cmd = CMD_POLL_STATUS;
        rawBytes = buildFrame(cmd, laneId, { bambini: true, cosmic: false, kbd_lock: false, no_speed: false, swap_off: false }, 0x55);
      } else if (rand < 0.9) {
        cmd = CMD_STATUS_OK;
        rawBytes = buildFrame(cmd, laneId, null, 0x55);
        rawBytes[2] = Math.floor(Math.random() * 255);
        rawBytes[3] = Math.floor(Math.random() * 255);
        rawBytes[4] = 0x04;
        rawBytes[5] = 0x30;
        rawBytes[6] = 0x00;
        let sum = 0;
        for (let i = 0; i < rawBytes.length - 1; i++) {
          sum = (sum + rawBytes[i]) & 0xff;
        }
        rawBytes[rawBytes.length - 1] = sum;
      } else if (rand < 0.95) {
        cmd = CMD_RESET_LANE;
        rawBytes = buildFrame(cmd, laneId, null, 0x55);
      } else {
        cmd = 0x99;
        rawBytes = new Uint8Array(30);
        for (let i = 0; i < rawBytes.length; i++) {
          rawBytes[i] = Math.floor(Math.random() * 256);
        }
        checksumOk = false;
        parseError = "Неизвестная команда или неверная контрольная сумма";
        this.droppedFrames++;
      }

      this.totalFrames++;

      const hexParts: string[] = [];
      for (let i = 0; i < rawBytes.length; i++) {
        hexParts.push(rawBytes[i].toString(16).padStart(2, "0").toUpperCase());
      }
      const raw_hex = hexParts.join(" ");

      const msg: MockWsMessage = {
        type: "frame",
        direction,
        timestamp: new Date().toISOString(),
        raw_hex,
        lane_id: cmd === 0x99 ? null : laneId,
        checksum_ok: checksumOk,
        parse_error: parseError,
        baud,
      };

      if (this.onmessage && !this.isClosed) {
        this.onmessage({ data: JSON.stringify(msg) });
      }

      const nextInterval = Math.floor(Math.random() * 250) + 100;
      this.timerId = window.setTimeout(emitFrame, nextInterval);
    };

    this.timerId = window.setTimeout(emitFrame, 200);

    const emitStatus = () => {
      if (this.isClosed) return;
      const statusMsg: MockWsMessage = {
        type: "status",
        transport: "mock",
        endpoint: "mock://sniffer/rs485",
        baud: 9600,
        status: "online",
        dropped_frames: this.droppedFrames,
        total_frames: this.totalFrames,
      };
      if (this.onmessage && !this.isClosed) {
        this.onmessage({ data: JSON.stringify(statusMsg) });
      }
      this.statusTimerId = window.setTimeout(emitStatus, 3000);
    };
    this.statusTimerId = window.setTimeout(emitStatus, 1000);

    const emitError = () => {
      if (this.isClosed) return;
      const errLane = Math.floor(Math.random() * 24) + 1;
      const errorMsg: MockWsMessage = {
        type: "error",
        message: `CRC mismatch на дорожке #${errLane} (таймаут ответа)`,
        code: "ERR_CRC_MISMATCH",
        lane_id: errLane,
      };
      if (this.onmessage && !this.isClosed) {
        this.onmessage({ data: JSON.stringify(errorMsg) });
      }
      this.errorTimerId = window.setTimeout(emitError, 30000);
    };
    this.errorTimerId = window.setTimeout(emitError, 15000);

    const emitHeartbeat = () => {
      if (this.isClosed) return;
      this.heartbeatTimerId = window.setTimeout(emitHeartbeat, 2000);
    };
    this.heartbeatTimerId = window.setTimeout(emitHeartbeat, 2000);
  }

  public close() {
    if (this.isClosed) return;
    this.isClosed = true;
    if (this.timerId) clearTimeout(this.timerId);
    if (this.statusTimerId) clearTimeout(this.statusTimerId);
    if (this.errorTimerId) clearTimeout(this.errorTimerId);
    if (this.heartbeatTimerId) clearTimeout(this.heartbeatTimerId);
    if (this.onclose) {
      this.onclose();
    }
  }

  public send(_data: string) {}
}

let mockInstance: MockSnifferSocket | null = null;

export function getMockSniffer(): MockSnifferSocket {
  if (!mockInstance || (mockInstance as any).isClosed) {
    mockInstance = new MockSnifferSocket();
  }
  return mockInstance;
}
