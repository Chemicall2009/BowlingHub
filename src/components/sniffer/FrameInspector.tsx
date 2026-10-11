/**
 * @file src/components/sniffer/FrameInspector.tsx
 * @description Инспектор деталей выбранного кадра (полный hex, распарсенные поля, кегли, опции).
 */

import React, { useState } from "react";
import { X, Copy, Check, Terminal, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import type { SnifferFrame } from "../../api/sniffer";
import { FramePreview } from "../emulator/FramePreview";
import { PinTriangle } from "../lane/PinTriangle";
import { formatTimestamp } from "../../lib/format";
import { toast } from "sonner";

interface FrameInspectorProps {
  frame: SnifferFrame | null;
  onClose: () => void;
}

export function FrameInspector({ frame, onClose }: FrameInspectorProps) {
  const [copiedJson, setCopiedJson] = useState(false);

  if (!frame) {
    return null;
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(frame, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    toast.success("Кадр скопирован в формате JSON");
  };

  const parsed = frame.parsed;

  return (
    <div className="w-full lg:w-[420px] bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white">Инспектор кадра</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 flex flex-col gap-5">
        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-500">ID:</span>
            <span className="text-zinc-300">{frame.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Время:</span>
            <span className="text-zinc-300">{formatTimestamp(frame.timestamp)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Направление:</span>
            <span className={frame.direction === "rx" ? "text-emerald-400 font-bold" : "text-blue-400 font-bold"}>
              {frame.direction.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Скорость шины:</span>
            <span className="text-zinc-300">{frame.baud} baud</span>
          </div>
          {parsed && (
            <>
              <div className="flex justify-between">
                <span className="text-zinc-500">Дорожка:</span>
                <span className="text-white font-bold">#{parsed.laneId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Команда:</span>
                <span className="text-blue-400 font-bold">{parsed.cmdName} (0x{parsed.cmd.toString(16).toUpperCase()})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Контрольная сумма:</span>
                <span className={parsed.checksumOk ? "text-emerald-400 flex items-center gap-1" : "text-red-400 flex items-center gap-1"}>
                  {parsed.checksumOk ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  0x{parsed.checksum.toString(16).toUpperCase()} ({parsed.checksumOk ? "OK" : "FAIL"})
                </span>
              </div>
            </>
          )}
        </div>

        {frame.parse_error && (
          <div className="bg-red-950/40 border border-red-800/80 p-3 rounded-lg text-xs text-red-300">
            <strong>Ошибка парсинга:</strong> {frame.parse_error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-zinc-400">Сырые байты (RAW HEX)</span>
          <FramePreview rawHex={frame.raw_hex} />
        </div>

        {parsed?.pinState && (
          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex flex-col items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400 self-start">Состояние кеглей (STATUS_OK)</span>
            <PinTriangle pins={parsed.pinState.pins} size="md" />
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 mt-1">
              <span>Заступ 1: {parsed.pinState.foul1 ? "ДА" : "нет"}</span>
              <span>Заступ 2: {parsed.pinState.foul2 ? "ДА" : "нет"}</span>
              <span>Сплит: {parsed.pinState.split ? "ДА" : "нет"}</span>
            </div>
            {parsed.pinState.speed !== null && (
              <span className="text-xs text-emerald-400 font-mono">Скорость тики: {parsed.pinState.speed}</span>
            )}
          </div>
        )}

        {parsed?.options && (
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-400">Опции дорожки (POLL_STATUS)</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-300">
              <div>Бамперы: {parsed.options.bambini ? "ВКЛ" : "ВЫКЛ"}</div>
              <div>Космос: {parsed.options.cosmic ? "ВКЛ" : "ВЫКЛ"}</div>
              <div>Блокировка: {parsed.options.kbd_lock ? "ВКЛ" : "ВЫКЛ"}</div>
              <div>Без скорости: {parsed.options.no_speed ? "ВКЛ" : "ВЫКЛ"}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white gap-2 text-xs"
            onClick={handleCopyJson}
          >
            {copiedJson ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            Копировать JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
