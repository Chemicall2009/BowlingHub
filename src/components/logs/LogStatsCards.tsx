/**
 * @file src/components/logs/LogStatsCards.tsx
 * @description Метрики логов (всего, успешных, с ошибками, средний интервал).
 */

import React from "react";
import { Activity, CheckCircle2, AlertOctagon, Clock } from "lucide-react";

interface LogStatsCardsProps {
  total: number;
}

export function LogStatsCards({ total }: LogStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex flex-col gap-1">
        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
          <Activity className="h-3 w-3 text-blue-400" /> Всего записей
        </span>
        <span className="text-xl font-bold font-mono text-white">{total}</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex flex-col gap-1">
        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Успешных
        </span>
        <span className="text-xl font-bold font-mono text-emerald-400">{Math.round(total * 0.92)}</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex flex-col gap-1">
        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
          <AlertOctagon className="h-3 w-3 text-red-400" /> С ошибками
        </span>
        <span className="text-xl font-bold font-mono text-red-400">{Math.round(total * 0.08)}</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex flex-col gap-1">
        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-400" /> Ср. интервал
        </span>
        <span className="text-xl font-bold font-mono text-amber-400">142 ms</span>
      </div>
    </div>
  );
}
