/**
 * @file src/components/settings/ProtocolTab.tsx
 * @description Вкладка настройки протокола LCom (шифрование, XOR-маска, контрольная сумма, тайминги).
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ShieldAlert, Terminal, Sliders, Check } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import type { SettingsFormValues } from "../../lib/settingsSchema";
import { buildFrame, CMD_POLL_STATUS, formatFrameHex } from "../../lib/lcom";
import { FramePreview } from "../emulator/FramePreview";

export function ProtocolTab() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<SettingsFormValues>();
  const xorMaskHex = watch("xor_mask_hex");
  const frameLength = watch("frame_length");
  const checksumVariant = watch("checksum_variant");
  const pollInterval = watch("poll_interval_ms");
  const pollTimeout = watch("poll_timeout_ms");
  const interPacketDelay = watch("inter_packet_delay_ms");
  const autoBaud = watch("auto_baud_switch");

  const [showTable, setShowTable] = useState(false);
  const [testFrameHex, setTestFrameHex] = useState<string | null>(null);

  const handleTestFrame = () => {
    try {
      let mask: number | Uint8Array = 0x55;
      if (xorMaskHex.length === 2) {
        mask = parseInt(xorMaskHex, 16);
      } else if (xorMaskHex.length === 60) {
        const bytes = new Uint8Array(30);
        for (let i = 0; i < 30; i++) {
          bytes[i] = parseInt(xorMaskHex.substring(i * 2, i * 2 + 2), 16);
        }
        mask = bytes;
      }
      const frame = buildFrame(CMD_POLL_STATUS, 1, null, mask, frameLength === 31);
      setTestFrameHex(formatFrameHex(frame));
    } catch {
      setTestFrameHex("Ошибка генерации кадра: проверьте формат XOR-маски");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Протокол LCom и Шифрование</h2>
        <p className="text-xs text-zinc-400">Настройка масок дешифрования полезной нагрузки, длин кадров и таймингов шины RS-485.</p>
      </div>

      {/* Шифрование */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white">Шифрование payload (XOR)</h3>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-zinc-300">XOR Маска (HEX)</Label>
          <div className="flex gap-2">
            <Input
              {...register("xor_mask_hex")}
              placeholder="00 или таблица 60 символов"
              className="bg-zinc-950 border-zinc-800 font-mono text-xs text-zinc-200"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-700 hover:text-white flex-shrink-0"
              onClick={() => setShowTable(!showTable)}
            >
              {showTable ? "Скрыть таблицу" : "Показать таблицу"}
            </Button>
          </div>
          {errors.xor_mask_hex && <span className="text-[11px] text-red-400">{errors.xor_mask_hex.message}</span>}
          <span className="text-[11px] text-zinc-500">Одно значение (2 hex символа) либо таблица из 30 байт (60 hex символов).</span>
        </div>

        {xorMaskHex === "00" && (
          <div className="bg-amber-950/40 border border-amber-800/80 p-3 rounded-lg flex items-start gap-2.5 text-xs text-amber-200">
            <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>TODO: уточнить XOR-маску из этапа 1. Пока сниффер может показывать битые кадры или нераспознанный трафик.</span>
          </div>
        )}

        {showTable && (
          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex flex-col gap-3">
            <span className="text-xs font-semibold text-zinc-300">Таблица XOR-маски (30 байт)</span>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => {
                const byteHex = xorMaskHex.substring(i * 2, i * 2 + 2).padEnd(2, "0");
                return (
                  <div key={i} className="flex flex-col items-center bg-zinc-900 border border-zinc-800 p-1 rounded text-[10px] font-mono">
                    <span className="text-zinc-500">#{i}</span>
                    <span className="text-emerald-400 font-bold">{byteHex}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Формат кадра и CRC */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-zinc-300 font-semibold">Длина кадра LCom</Label>
          <Select
            value={frameLength.toString()}
            onValueChange={(val) => setValue("frame_length", parseInt(val, 10) as any, { shouldDirty: true })}
          >
            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="30">30 байт (Стандартный)</SelectItem>
              <SelectItem value="31">31 байт (Extended VDB)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-zinc-300 font-semibold">Алгоритм контрольной суммы</Label>
          <Select
            value={checksumVariant}
            onValueChange={(val) => setValue("checksum_variant", val as any, { shouldDirty: true })}
          >
            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="sum256">Modulo-256 (Сумма байтов)</SelectItem>
              <SelectItem value="xor">Побайтовый XOR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Тайминги */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-400" /> Тайминги поллинга шины
          </h3>
          <div className="flex items-center gap-2">
            <Switch
              checked={autoBaud}
              onCheckedChange={(checked) => setValue("auto_baud_switch", checked, { shouldDirty: true })}
            />
            <span className="text-xs text-zinc-300">Автопереключение baud 9600→19200</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Интервал опроса:</span>
              <strong className="text-white font-mono">{pollInterval} ms</strong>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              {...register("poll_interval_ms", { valueAsNumber: true })}
              className="accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Таймаут ответа:</span>
              <strong className="text-white font-mono">{pollTimeout} ms</strong>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              {...register("poll_timeout_ms", { valueAsNumber: true })}
              className="accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Пауза между пакетами:</span>
              <strong className="text-white font-mono">{interPacketDelay} ms</strong>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              {...register("inter_packet_delay_ms", { valueAsNumber: true })}
              className="accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-amber-950/30 border border-amber-900/60 p-3 rounded-lg text-xs text-amber-200">
          ⚠️ Изменение таймингов может привести к коллизиям на шине RS-485. Меняйте только при отладке.
        </div>
      </div>

      {/* Тест сборки кадра */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" /> Проверка сборки тестового кадра
        </h3>
        <p className="text-xs text-zinc-400">Сгенерировать тестовый кадр POLL_STATUS для дорожки #1 с текущей XOR-маской и проверить контрольную сумму.</p>

        <Button
          type="button"
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 text-white w-fit text-xs gap-2"
          onClick={handleTestFrame}
        >
          <Check className="h-4 w-4" /> Сгенерировать и проверить кадр
        </Button>

        {testFrameHex && <FramePreview rawHex={testFrameHex} className="mt-2" />}
      </div>
    </div>
  );
}
