/**
 * @file src/tv/components/TvShotIndicator.tsx
 * @description Shot number indicator (1st throw, 2nd throw).
 */

import React from "react";

interface TvShotIndicatorProps {
  shotNumber: number;
}

export const TvShotIndicator: React.FC<TvShotIndicatorProps> = ({ shotNumber }) => {
  return (
    <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700/50 px-4 py-2 rounded-xl text-zinc-300 font-mono font-bold text-lg shadow-lg">
      <span className="text-zinc-500">Бросок:</span>
      <span className="text-emerald-400">{shotNumber}</span>
    </div>
  );
};
