import type { FrameScore } from "../../api/types";
import { cn } from "../../lib/utils";

interface FrameCellProps {
  frameData?: FrameScore;
  frameNumber: number;
  isCurrent?: boolean;
}

export function FrameCell({
  frameData,
  frameNumber,
  isCurrent = false,
}: FrameCellProps) {
  const rolls = frameData?.rolls || [];
  const isTenthFrame = frameNumber === 10;

  // Format rolls representation: Strike 'X', Spare '/', Foul 'F', Miss '-'
  const renderRoll = (val: number | string | undefined) => {
    if (val === undefined) return "";
    if (val === "X") return <span className="text-amber-400 font-bold">X</span>;
    if (val === "/") return <span className="text-emerald-400 font-bold">/</span>;
    if (val === "F") return <span className="text-red-400 font-bold">F</span>;
    if (val === 0 || val === "-") return <span className="text-zinc-500">-</span>;
    return <span className="text-zinc-200">{val}</span>;
  };

  return (
    <div
      className={cn(
        "flex flex-col border border-zinc-800 bg-zinc-950/70 text-center font-mono transition-all",
        isTenthFrame ? "w-28 min-w-[112px]" : "w-16 min-w-[64px]",
        isCurrent && "ring-2 ring-emerald-500 bg-emerald-950/20"
      )}
    >
      {/* Frame Header Number */}
      <div className="bg-zinc-900/90 py-0.5 text-[10px] font-semibold text-zinc-400 border-b border-zinc-800">
        {frameNumber}
      </div>

      {/* Frame Rolls Boxes */}
      <div className="flex h-8 border-b border-zinc-800 text-xs">
        {isTenthFrame ? (
          <>
            <div className="flex-1 flex items-center justify-center border-r border-zinc-800 font-bold">
              {renderRoll(rolls[0])}
            </div>
            <div className="flex-1 flex items-center justify-center border-r border-zinc-800 font-bold">
              {renderRoll(rolls[1])}
            </div>
            <div className="flex-1 flex items-center justify-center font-bold">
              {renderRoll(rolls[2])}
            </div>
          </>
        ) : (
          <>
            {/* First roll: empty if strike or shown */}
            <div className="flex-1 flex items-center justify-center text-zinc-300">
              {rolls[0] === "X" ? "" : renderRoll(rolls[0])}
            </div>
            {/* Second roll / Strike indicator */}
            <div className="w-6 flex items-center justify-center border-l border-zinc-800 bg-zinc-900/40 font-bold">
              {rolls[0] === "X" ? renderRoll("X") : renderRoll(rolls[1])}
            </div>
          </>
        )}
      </div>

      {/* Frame Cumulative Score */}
      <div className="h-7 flex items-center justify-center font-bold text-sm text-white">
        {frameData?.score !== null && frameData?.score !== undefined ? (
          frameData.score
        ) : (
          <span className="text-zinc-600 text-xs">—</span>
        )}
      </div>
    </div>
  );
}
