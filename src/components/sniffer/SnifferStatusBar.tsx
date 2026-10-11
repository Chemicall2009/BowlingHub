/**
 * @file src/components/sniffer/SnifferStatusBar.tsx
 * @description Строка состояния подключения сниффера (транспорт, эндпоинт, кадры, ошибки).
 */

import React, { useEffect, useState } from "react";
import { Activity, ShieldAlert, CheckCircle2, Wifi, WifiOff } from "lucide-react";
import type { SnifferStatus } from "../../api/sniffer";
import { formatRelativeTime } from "../../lib/format";

interface SnifferStatusBarProps {
  status: SnifferStatus | null;
  connected: boolean;
}

export function SnifferStatusBar({ status, connected }: SnifferStatusBarProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [prevTotal, setPrevTotal] = useState(0);

  useEffect(() => {
    if (status && status.total_frames !== prevTotal) {
      setIsFlashing(true);
      setPrevTotal(status.total_frames);
      const timer = setTimeout(() => setIsFlashing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [status, prevTotal]);

  if (!status) {
    return (
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-lg text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-red-400" />
          <span>Подключение к снифферу...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-lg text-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-medium">
          {connected && status.status === "online" ? (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
          )}
          <span className="text-zinc-200 uppercase tracking-wider font-semibold text-[11px]">
            {status.transport} ({status.endpoint})
          </span>
        </div>

        <span className="text-zinc-600">|</span>

        <span className="text-zinc-400">
          Связь: <strong className="text-zinc-200">{status.baud} baud</strong>
        </span>

        <span className="text-zinc-600">|</span>

        <span className="text-zinc-400">
          Старт: <strong className="text-zinc-200">{formatRelativeTime(status.connected_at)}</strong>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-1.5 transition-colors duration-200 ${isFlashing ? "text-emerald-400" : "text-zinc-300"}`}>
          <Activity className="h-3.5 w-3.5 text-blue-400" />
          <span>Всего кадров:</span>
          <strong className="font-mono text-white">{status.total_frames}</strong>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-300">
          <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
          <span>Пропущено / Ошибки CRC:</span>
          <strong className="font-mono text-red-400">{status.dropped_frames}</strong>
        </div>

        <div className="flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="capitalize">{status.status}</span>
        </div>
      </div>
    </div>
  );
}
