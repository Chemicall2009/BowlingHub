/**
 * @file src/lib/settingsSchema.ts
 * @description Zod-схема валидации настроек оборудования и протокола.
 */

import { z } from "zod";

const hexRegex = /^[0-9A-Fa-f]+$/;

export const settingsSchema = z
  .object({
    transport: z.enum(["serial", "tcp", "mock"]),
    serial_port: z.string().nullable(),
    serial_baud: z.union([z.literal(9600), z.literal(19200), z.literal(38400)]),
    tcp_host: z.string().nullable(),
    tcp_port: z.number().int().min(1).max(65535).nullable(),
    xor_mask_hex: z
      .string()
      .refine((val) => val.length === 2 || val.length === 60, {
        message: "XOR-маска должна быть длиной 2 символа (1 байт) или 60 символов (таблица 30 байт)",
      })
      .refine((val) => hexRegex.test(val), {
        message: "Допускаются только шестнадцатеричные символы (0-9, A-F)",
      }),
    checksum_variant: z.enum(["sum256", "xor"]),
    frame_length: z.union([z.literal(30), z.literal(31)]),
    lanes_count: z.number().int().min(2).max(48),
    lanes_start_number: z.union([z.literal(1), z.literal(2)]),
    poll_interval_ms: z.number().int().min(5).max(100),
    poll_timeout_ms: z.number().int().min(10).max(200),
    inter_packet_delay_ms: z.number().int().min(5).max(50),
    auto_baud_switch: z.boolean(),
    notifications: z.object({
      on_lane_offline: z.boolean(),
      on_checksum_error: z.boolean(),
      on_connection_lost: z.boolean(),
      sound_enabled: z.boolean(),
      email_webhook: z
        .string()
        .nullable()
        .refine((val) => !val || val.trim() === "" || z.string().url().safeParse(val).success, {
          message: "Некорректный URL вебхука",
        }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.transport === "serial") {
      if (!data.serial_port || data.serial_port.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["serial_port"],
          message: "Укажите путь к последовательному порту (например, /dev/ttyUSB0)",
        });
      }
    }
    if (data.transport === "tcp") {
      if (!data.tcp_host || data.tcp_host.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tcp_host"],
          message: "Укажите IP-адрес или хост TCP-моста",
        });
      }
    }
  });

export type SettingsFormValues = z.infer<typeof settingsSchema>;
