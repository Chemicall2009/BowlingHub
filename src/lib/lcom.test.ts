/**
 * @file src/lib/lcom.test.ts
 * @description Юнит-тесты протокола LCom (Mendes Bowland 1998).
 */

import { describe, it, expect } from "vitest";
import {
  FRAME_LEN,
  FRAME_LEN_EXTENDED,
  CMD_RESET_LANE,
  CMD_POLL_STATUS,
  CMD_UPLOAD_DATA,
  CMD_MACHINE_CTRL,
  CMD_STATUS_OK,
  CMD_LINE_FAIL,
  calcChecksum,
  applyXor,
  buildFrame,
  parseFrame,
  packOptions,
  unpackOptions,
  parsePins,
  formatFrameHex,
  cmdName,
  type LaneOptions,
} from "./lcom";

describe("LCom Protocol: Checksum & XOR", () => {
  it("calcChecksum на примере [0x02, 0x01, 0x00...0x00] вычисляет корректную сумму", () => {
    const frame = new Uint8Array(FRAME_LEN);
    frame[0] = 0x02;
    frame[1] = 0x01;
    // Остальные байты до FRAME_LEN - 2 равны 0
    // Сумма байтов 0..28: 0x02 + 0x01 = 0x03
    const sum = calcChecksum(frame);
    expect(sum).toBe(0x03);
  });

  it("XOR с маской 0x00 оставляет данные без изменений", () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a]);
    const masked = applyXor(data, 0x00);
    expect(masked).toEqual(data);
  });

  it("XOR с маской 0xA5 и повторное применение восстанавливает исходные данные", () => {
    const data = new Uint8Array([0x01, 0xff, 0x55, 0xaa, 0x00, 0x42]);
    const masked = applyXor(data, 0xa5);
    const unmasked = applyXor(masked, 0xa5);
    expect(unmasked).toEqual(data);
  });

  it("XOR с табличной маской (Uint8Array) циклически инвертирует биты", () => {
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    const tableMask = new Uint8Array([0x10, 0x20]);
    const masked = applyXor(data, tableMask);
    expect(masked).toEqual(new Uint8Array([0x10, 0x20, 0x10, 0x20]));
    const unmasked = applyXor(masked, tableMask);
    expect(unmasked).toEqual(data);
  });
});

describe("LCom Protocol: Options packing", () => {
  it("корректно упаковывает и распаковывает все 5 опций", () => {
    const opts: LaneOptions = {
      bambini: true,
      cosmic: false,
      kbd_lock: true,
      no_speed: false,
      swap_off: true,
    };
    const packed = packOptions(opts);
    // бит 0 (1) + бит 2 (4) + бит 4 (16) = 21 (0x15)
    expect(packed).toBe(0x15);

    const unpacked = unpackOptions(packed);
    expect(unpacked).toEqual(opts);
  });
});

describe("LCom Protocol: parsePins", () => {
  it("корректно распознает каждую из 10 кеглей по отдельности", () => {
    // 10 кеглей: первые 8 в byte2, 9 и 10 в byte3
    for (let pinIdx = 0; pinIdx < 10; pinIdx++) {
      let b2 = 0;
      let b3 = 0;
      if (pinIdx < 8) {
        b2 = 1 << pinIdx;
      } else {
        b3 = 1 << (pinIdx - 8);
      }

      const res = parsePins(b2, b3, 0x00, 0);
      expect(res.pins[pinIdx]).toBe(true);
      // Все остальные должны быть false
      const otherPins = res.pins.filter((_, idx) => idx !== pinIdx);
      expect(otherPins.every((p) => p === false)).toBe(true);
    }
  });

  it("корректно распознает все 10 кеглей стоящими одновременно + флаги и скорость", () => {
    // Все кегли: b2 = 0xFF, b3 = 0x03
    // flags: foul1 = 0x01, foul2 = 0x02, split = 0x04 -> 0x07
    // speedLE: 1250 тиков
    const state = parsePins(0xff, 0x03, 0x07, 1250);
    expect(state.pins.every((p) => p === true)).toBe(true);
    expect(state.foul1).toBe(true);
    expect(state.foul2).toBe(true);
    expect(state.split).toBe(true);
    expect(state.speed).toBe(1250);
  });
});

describe("LCom Protocol: buildFrame + parseFrame (Round-trip)", () => {
  const commandsToTest = [
    CMD_RESET_LANE,
    CMD_POLL_STATUS,
    CMD_UPLOAD_DATA,
    CMD_MACHINE_CTRL,
    CMD_STATUS_OK,
  ];

  it("buildFrame + parseFrame дают корректный round-trip на 5 разных командах", () => {
    const xorMask = 0x5a;
    const testOptions: LaneOptions = {
      bambini: true,
      cosmic: true,
      kbd_lock: false,
      no_speed: true,
      swap_off: false,
    };

    commandsToTest.forEach((cmd, idx) => {
      const laneId = idx + 1; // 1..5
      const opts = cmd === CMD_POLL_STATUS ? testOptions : null;

      const built = buildFrame(cmd, laneId, opts, xorMask);
      expect(built.length).toBe(FRAME_LEN);

      const parsed = parseFrame(built, xorMask);
      expect(parsed).not.toBeNull();
      expect(parsed?.cmd).toBe(cmd);
      expect(parsed?.laneId).toBe(laneId);
      expect(parsed?.checksumOk).toBe(true);
      expect(parsed?.cmdName).toBe(cmdName(cmd));

      if (cmd === CMD_POLL_STATUS) {
        expect(parsed?.options).toEqual(testOptions);
      }
    });
  });

  it("buildFrame + parseFrame корректно работают с extended=true (31 байт)", () => {
    const built = buildFrame(CMD_RESET_LANE, 12, null, 0x00, true);
    expect(built.length).toBe(FRAME_LEN_EXTENDED);

    const parsed = parseFrame(built, 0x00);
    expect(parsed).not.toBeNull();
    expect(parsed?.cmd).toBe(CMD_RESET_LANE);
    expect(parsed?.laneId).toBe(12);
  });

  it("parseFrame возвращает null при поврежденной контрольной сумме", () => {
    const built = buildFrame(CMD_RESET_LANE, 1, null, 0x00);
    // Портим байт checksum в конце
    built[built.length - 1] = (built[built.length - 1] + 1) & 0xff;

    const parsed = parseFrame(built, 0x00);
    expect(parsed).toBeNull();
  });

  it("parseFrame возвращает null при неизвестной команде или невалидном laneId", () => {
    // Неизвестная команда 0x33
    const frame = new Uint8Array(FRAME_LEN);
    frame[0] = 0x33;
    frame[1] = 0x01;
    frame[FRAME_LEN - 1] = calcChecksum(frame);
    expect(parseFrame(frame, 0x00)).toBeNull();

    // Невалидный laneId = 0x00
    frame[0] = CMD_RESET_LANE;
    frame[1] = 0x00;
    frame[FRAME_LEN - 1] = calcChecksum(frame);
    expect(parseFrame(frame, 0x00)).toBeNull();

    // Невалидный laneId = 0x35 (53 > 48)
    frame[1] = 0x35;
    frame[FRAME_LEN - 1] = calcChecksum(frame);
    expect(parseFrame(frame, 0x00)).toBeNull();
  });

  it("formatFrameHex корректно преобразует байты в форматированную строку HEX", () => {
    const bytes = new Uint8Array([0x01, 0x0a, 0xff]);
    expect(formatFrameHex(bytes)).toBe("01 0A FF");
  });
});
