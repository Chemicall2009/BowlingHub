/**
 * @file src/tv/components/TvSpeedAlert.tsx
 * @description Throw speed display component with km/h gauge.
 */

import React from "react";
import { Gauge, Zap } from "lucide-react";

interface TvSpeedAlertProps {
  speedKmh: number | null;
}

export const TvSpeedAlert: React.FC<TvSpeedAlertProps> = ({ speedKmh }) => {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center shadow-xl backdrop-blur-md">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center space-x-1.5">
        <Gauge className="w-4 h-4 text-amber-400" />
        <span>Скорость броска</span>
      </div>

      <div className="flex items-baseline space-x-2 my-2">
        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 tracking-tighter">
          {speedKmh !== null && speedKmh !== undefined ? speedKmh.toFixed(1) : "--.-"}
        </span>
        <span className="text-sm font-bold text-zinc-400 uppercase">км/ч</span>
      </div>

      <div className="w-full bg-zinc-800/60 rounded-full h-2 mt-2 overflow-hidden border border-zinc-700/50">
        <div
          className="bg-gradient-to-r from-amber-500 to-red-600 h-full transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(100, ((speedKmh || 0) / 45) * 100)}%` }}
        />
      </div>

      <div className="flex items-center space-x-1 text-[11px] text-zinc-500 mt-2">
        <Zap className="w-3 h-3 text-amber-400" />
        <span>Определено по датчикам LCom / ИК-барьеру</span>
      </div>
    </div>
  );
};
