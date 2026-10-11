/**
 * @file src/tv/components/TvFrameCell.tsx
 * @description Single bowling frame cell showing rolls and cumulative score.
 */

import React from "react";

interface TvFrameCellProps {
  frameNum: number;
  rolls: (number | null)[];
  cumulative: number | null;
  isCurrent: boolean;
}

export const TvFrameCell: React.FC<TvFrameCellProps> = ({
  frameNum,
  rolls,
  cumulative,
  isCurrent,
}) => {
  const isLast = frameNum === 10;
  const [r1, r2, r3] = rolls;

  const formatRoll = (roll: number | null, index: number) => {
    if (roll === null || roll === undefined) return "";
    if (roll === 10) {
      return isLast && index > 0 ? "X" : "X";
    }
    if (index > 0 && rolls[index - 1] !== null && (rolls[index - 1] as number) + roll === 10) {
      return "/";
    }
    if (roll === 0) return "-";
    return roll.toString();
  };

  return (
    <div
      className={`flex flex-col border border-zinc-700/60 rounded-lg overflow-hidden bg-zinc-900/80 min-w-[50px] ${
        isCurrent ? "ring-2 ring-emerald-500 bg-zinc-800/90 shadow-lg shadow-emerald-950/50" : ""
      }`}
    >
      <div className="bg-zinc-800 text-center text-xs font-bold text-zinc-400 py-1 border-b border-zinc-700/60">
        {frameNum}
      </div>
      <div className="grid grid-cols-2 divide-x divide-zinc-700/50 text-center text-sm font-mono h-8 items-center font-bold">
        <div className="text-zinc-200">{formatRoll(r1, 0)}</div>
        <div className="text-zinc-200">
          {isLast ? (
            <div className="grid grid-cols-2 divide-x divide-zinc-700/50 h-full items-center">
              <span>{formatRoll(r2, 1)}</span>
              <span>{formatRoll(r3, 2)}</span>
            </div>
          ) : (
            formatRoll(r2, 1)
          )}
        </div>
      </div>
      <div className="bg-zinc-950 text-center text-xs font-mono font-bold text-emerald-400 py-1 border-t border-zinc-700/50">
        {cumulative ?? ""}
      </div>
    </div>
  );
};
