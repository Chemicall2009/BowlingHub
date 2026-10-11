/**
 * @file src/lib/lcom.ts
 * @description Локальная реализация протокола LCom (Mendes Bowland 1998, RS-485).
 * Чистые функции для сборки, парсинга, валидации и форматирования кадра.
 */

// ============================================================
// 1. КОНСТАНТЫ ПРОТОКОЛА
// ============================================================

/** Стандартная длина кадра LCom (байт) */
export const FRAME_LEN = 30;

/** Расширенная длина кадра LCom (байт) */
export const FRAME_LEN_EXTENDED = 31;

/** Минимальный адрес дорожки (1) */
export const LANE_ID_MIN = 0x01;

/** Максимальный адрес дорожки (48) */
export const LANE_ID_MAX = 0x30;

/** Команда сброса пинсеттера */
export const CMD_RESET_LANE = 0x01;

/** Команда опроса статуса дорожки */
export const CMD_POLL_STATUS = 0x02;

/** Команда загрузки данных */
export const CMD_UPLOAD_DATA = 0x03;

/** Команда прямого управления машиной (бортики, свет) */
export const CMD_MACHINE_CTRL = 0x0a;

/** Ответ: статус в норме */
export const CMD_STATUS_OK = 0x40;

/** Ошибка линии / таймаут связи */
export const CMD_LINE_FAIL = 0xff;

// ============================================================
// 2. ТИПЫ
// ============================================================

/**
 * Опции и флаги режима дорожки LCom.
 */
export type LaneOptions = {
  /** Бит 0: автоматические детские бортики (бамперы) */
  bambini: boolean;
  /** Бит 1: ультрафиолетовый / космический свет */
  cosmic: boolean;
  /** Бит 2: блокировка консоли дорожки */
  kbd_lock: boolean;
  /** Бит 3: отключение датчика скорости шара */
  no_speed: boolean;
  /** Бит 4: запрет автосмены дорожек в паре */
  swap_off: boolean;
};

/**
 * Состояние кеглей и датчиков дорожки.
 */
export type PinState = {
  /** 10 элементов: index 0 = кегля №1 (головная), true = стоит, false = сбита */
  pins: boolean[];
  /** Датчик заступа 1 */
  foul1: boolean;
  /** Датчик заступа 2 */
  foul2: boolean;
  /** Флаг сплита */
  split: boolean;
  /** Тики аппаратного таймера скорости шара (16-bit LE) или null */
  speed: number | null;
};

/**
 * Распарсенный кадр протокола LCom.
 */
export type ParsedFrame = {
  /** Байт команды */
  cmd: number;
  /** Человекочитаемое имя команды */
  cmdName: string;
  /** Адрес дорожки (1..48) */
  laneId: number;
  /** Полезная нагрузка (27 байт для FRAME_LEN или 28 для FRAME_LEN_EXTENDED) */
  payload: Uint8Array;
  /** Байт контрольной суммы */
  checksum: number;
  /** Результат валидации контрольной суммы */
  checksumOk: boolean;
  /** Сырые байты входящего кадра */
  raw: Uint8Array;
  /** Состояние кеглей (присутствует для CMD_STATUS_OK) */
  pinState?: PinState;
  /** Опции дорожки (присутствует для CMD_POLL_STATUS) */
  options?: LaneOptions;
};

// ============================================================
// 3. ФУНКЦИИ
// ============================================================

/**
 * Возвращает имя команды LCom по её коду.
 * @param cmd Байт команды
 */
export function cmdName(cmd: number): string {
  switch (cmd) {
    case CMD_RESET_LANE:
      return "RESET_LANE";
    case CMD_POLL_STATUS:
      return "POLL_STATUS";
    case CMD_UPLOAD_DATA:
      return "UPLOAD_DATA";
    case CMD_MACHINE_CTRL:
      return "MACHINE_CTRL";
    case CMD_STATUS_OK:
      return "STATUS_OK";
    case CMD_LINE_FAIL:
      return "LINE_FAIL";
    default:
      return `UNKNOWN(0x${cmd.toString(16).toUpperCase().padStart(2, "0")})`;
  }
}

/**
 * Вычисляет контрольную сумму кадра: сумма байтов 0..len-2 по модулю 256.
 * @param bytes Полный кадр либо массив байтов
 */
export function calcChecksum(bytes: Uint8Array): number {
  const limit = bytes.length - 1;
  let sum = 0;
  for (let i = 0; i < limit; i++) {
    sum = (sum + bytes[i]) & 0xff;
  }
  return sum;
}

/**
 * Симметричная операция XOR над массивом данных.
 * @param data Исходные байты
 * @param mask Одиночный байт либо таблица байтов маски
 */
export function applyXor(
  data: Uint8Array,
  mask: number | Uint8Array
): Uint8Array {
  const result = new Uint8Array(data.length);

  if (typeof mask === "number") {
    const singleMask = mask & 0xff;
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ singleMask;
    }
    return result;
  }

  if (mask.length === 0) {
    result.set(data);
    return result;
  }

  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ mask[i % mask.length];
  }
  return result;
}

/**
 * Упаковывает флаги опций в один байт.
 * @param opts Частичные или полные опции дорожки
 */
export function packOptions(opts: Partial<LaneOptions>): number {
  let byte = 0;
  if (opts.bambini) byte |= 1 << 0;
  if (opts.cosmic) byte |= 1 << 1;
  if (opts.kbd_lock) byte |= 1 << 2;
  if (opts.no_speed) byte |= 1 << 3;
  if (opts.swap_off) byte |= 1 << 4;
  return byte;
}

/**
 * Распаковывает байт опций в объект флагов.
 * @param byte Байт опций
 */
export function unpackOptions(byte: number): LaneOptions {
  return {
    bambini: (byte & (1 << 0)) !== 0,
    cosmic: (byte & (1 << 1)) !== 0,
    kbd_lock: (byte & (1 << 2)) !== 0,
    no_speed: (byte & (1 << 3)) !== 0,
    swap_off: (byte & (1 << 4)) !== 0,
  };
}

/**
 * Парсит состояние кеглей, заступов и скорости из байтов телеметрии.
 * @param byte2 Байт кеглей 1..8
 * @param byte3 Байт кеглей 9..10
 * @param flagsByte Байт флагов (foul1, foul2, split)
 * @param speedLE 16-битное число скорости в формате Little-Endian
 */
export function parsePins(
  byte2: number,
  byte3: number,
  flagsByte: number,
  speedLE: number
): PinState {
  const pins: boolean[] = [
    (byte2 & (1 << 0)) !== 0, // Кегля 1
    (byte2 & (1 << 1)) !== 0, // Кегля 2
    (byte2 & (1 << 2)) !== 0, // Кегля 3
    (byte2 & (1 << 3)) !== 0, // Кегля 4
    (byte2 & (1 << 4)) !== 0, // Кегля 5
    (byte2 & (1 << 5)) !== 0, // Кегля 6
    (byte2 & (1 << 6)) !== 0, // Кегля 7
    (byte2 & (1 << 7)) !== 0, // Кегля 8
    (byte3 & (1 << 0)) !== 0, // Кегля 9
    (byte3 & (1 << 1)) !== 0, // Кегля 10
  ];

  return {
    pins,
    foul1: (flagsByte & (1 << 0)) !== 0,
    foul2: (flagsByte & (1 << 1)) !== 0,
    split: (flagsByte & (1 << 2)) !== 0,
    speed: speedLE === 0 ? null : speedLE,
  };
}

/**
 * Форматирует массив байтов в строку HEX вида "AA BB CC ...".
 * @param frame Байты кадра
 */
export function formatFrameHex(frame: Uint8Array): string {
  const hexParts: string[] = [];
  for (let i = 0; i < frame.length; i++) {
    hexParts.push(frame[i].toString(16).padStart(2, "0").toUpperCase());
  }
  return hexParts.join(" ");
}

/**
 * Сборка кадра LCom (30 или 31 байт).
 * Структура: [cmd][laneId][payload: 27 или 28 байт][checksum]
 * Порядок: payload (02..len-2) → XOR → checksum от байтов 00..len-2 → checksum в позицию len-1.
 *
 * @param cmd Код команды
 * @param laneId Адрес дорожки (0x01..0x30)
 * @param options Опции дорожки (упаковываются в первый байт payload)
 * @param xorMask Маска XOR для шифрования payload
 * @param extended true для 31-байтового кадра, иначе 30-байтовый
 */
export function buildFrame(
  cmd: number,
  laneId: number,
  options: LaneOptions | null,
  xorMask: number | Uint8Array,
  extended?: boolean
): Uint8Array {
  const len = extended ? FRAME_LEN_EXTENDED : FRAME_LEN;
  const frame = new Uint8Array(len);

  // Заголовок (байты 0 и 1 НЕ маскируются)
  frame[0] = cmd & 0xff;
  frame[1] = laneId & 0xff;

  // Формируем чистый payload (байты 2..len-2)
  const payloadLen = len - 3;
  const rawPayload = new Uint8Array(payloadLen);

  if (options !== null) {
    rawPayload[0] = packOptions(options);
  }

  // Применяем XOR к payload
  const maskedPayload = applyXor(rawPayload, xorMask);
  frame.set(maskedPayload, 2);

  // Вычисляем контрольную сумму по байтам 0..len-2
  const checksum = calcChecksum(frame);
  frame[len - 1] = checksum;

  return frame;
}

/**
 * Парсит сырой кадр LCom.
 *
 * Порядок:
 * 1. Проверка длины (30 или 31).
 * 2. Проверка контрольной суммы на сырых байтах.
 * 3. Проверка валидности команды и адреса дорожки.
 * 4. Снятие XOR с payload (байты 02..len-2).
 * 5. Распаковка специфичных полей (PinState для STATUS_OK, LaneOptions для POLL_STATUS).
 *
 * @param raw Сырой буфер кадра
 * @param xorMask Маска XOR для дешифрования payload
 * @returns ParsedFrame или null при ошибке валидации
 */
export function parseFrame(
  raw: Uint8Array,
  xorMask: number | Uint8Array
): ParsedFrame | null {
  // 1. Проверка длины
  if (raw.length !== FRAME_LEN && raw.length !== FRAME_LEN_EXTENDED) {
    return null;
  }

  // 2. Проверка контрольной суммы
  const calculatedChecksum = calcChecksum(raw);
  const frameChecksum = raw[raw.length - 1];
  if (calculatedChecksum !== frameChecksum) {
    return null;
  }

  const cmd = raw[0];
  const laneId = raw[1];

  // 3. Проверка валидности команды
  const knownCommands = [
    CMD_RESET_LANE,
    CMD_POLL_STATUS,
    CMD_UPLOAD_DATA,
    CMD_MACHINE_CTRL,
    CMD_STATUS_OK,
    CMD_LINE_FAIL,
  ];

  if (!knownCommands.includes(cmd)) {
    return null;
  }

  // Проверка диапазона адреса дорожки
  if (laneId < LANE_ID_MIN || laneId > LANE_ID_MAX) {
    return null;
  }

  // 4. Снятие XOR с полезной нагрузки (байты 2..raw.length - 2)
  const maskedPayload = raw.slice(2, raw.length - 1);
  const payload = applyXor(maskedPayload, xorMask);

  const parsed: ParsedFrame = {
    cmd,
    cmdName: cmdName(cmd),
    laneId,
    payload,
    checksum: frameChecksum,
    checksumOk: true,
    raw,
  };

  // 5. Распаковка данных для конкретных команд
  if (cmd === CMD_STATUS_OK && payload.length >= 5) {
    const speedLE = payload[3] | (payload[4] << 8);
    parsed.pinState = parsePins(payload[0], payload[1], payload[2], speedLE);
  } else if (cmd === CMD_POLL_STATUS && payload.length >= 1) {
    parsed.options = unpackOptions(payload[0]);
  }

  return parsed;
}

// ============================================================
// ПСЕВДОНИМЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
// ============================================================

/** Псевдоним ParsedFrame для совместимости */
export type LComPacket = ParsedFrame;

/** Псевдоним buildFrame для совместимости */
export const buildLComFrame = buildFrame;

/** Псевдоним parseFrame для совместимости */
export const parseLComFrame = parseFrame;

