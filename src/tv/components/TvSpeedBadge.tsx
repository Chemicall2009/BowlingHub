/**
 * @file src/tv/components/TvSpeedBadge.tsx
 * @description Speed display badge with Gauge icon.
 */

import React from "react";
import { Gauge } from "lucide-react";

interface TvSpeedBadgeProps {
  speedKmh: number | null;
}

export const TvSpeedBadge: React.FC<TvSpeedBadgeProps> = ({ speedKmh }) => {
  if (speedKmh === null || speedKmh === undefined) return null;
  return (
    <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700/50 px-4 py-2 rounded-xl text-emerald-400 font-mono font-bold text-xl shadow-lg">
      <Gauge className="w-6 h-6 animate-pulse" />
      <span>{speedKmh.toFixed(1)} км/ч</span>
    </div>
  );
};
