/**
 * @file src/tv/components/TvScoreTable.tsx
 * @description Classic 10-frame bowling scoreboard table for TV display.
 */

import React from "react";

interface PlayerScore {
  name: string;
  frames: Array<{
    roll1: string | number | null;
    roll2: string | number | null;
    roll3?: string | number | null; // for 10th frame
    score?: number | null;
  }>;
  total_score: number;
}

interface TvScoreTableProps {
  currentGame: {
    players: PlayerScore[];
    current_frame?: number;
    current_player_index?: number;
  } | null;
}

export const TvScoreTable: React.FC<TvScoreTableProps> = ({ currentGame }) => {
  const players = currentGame?.players || [
    {
      name: "Игрок 1",
      frames: Array(10).fill({ roll1: null, roll2: null, score: null }),
      total_score: 0,
    },
    {
      name: "Игрок 2",
      frames: Array(10).fill({ roll1: null, roll2: null, score: null }),
      total_score: 0,
    },
  ];

  const currentFrame = currentGame?.current_frame ?? 1;
  const currentPlayerIdx = currentGame?.current_player_index ?? 0;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md overflow-x-auto w-full">
      <div className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center justify-between">
        <span>Таблица счёта матча</span>
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
          Фрейм {currentFrame} / 10
        </span>
      </div>

      <div className="min-w-[800px]">
        {/* Header row: Frames 1-10 */}
        <div className="grid grid-cols-12 gap-1 mb-2 text-center text-xs font-bold text-zinc-400">
          <div className="col-span-2 text-left px-3 py-2 bg-zinc-800/50 rounded-lg">ИГРОК</div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`py-2 rounded-lg bg-zinc-800/40 border ${
                currentFrame === i + 1 ? "border-amber-500/50 text-amber-400 bg-amber-500/5" : "border-zinc-700/30"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Player rows */}
        {players.map((player, pIdx) => {
          const isCurrentPlayer = pIdx === currentPlayerIdx;
          return (
            <div
              key={pIdx}
              className={`grid grid-cols-12 gap-1 mb-2 items-center rounded-xl p-1 transition-all ${
                isCurrentPlayer ? "bg-amber-500/10 border border-amber-500/30 shadow-lg" : "bg-zinc-950/40 border border-zinc-800/40"
              }`}
            >
              {/* Player name & total */}
              <div className="col-span-2 px-3 py-2 flex items-center justify-between">
                <div>
                  <div className={`font-bold text-sm ${isCurrentPlayer ? "text-amber-300" : "text-white"}`}>
                    {player.name}
                  </div>
                  <div className="text-[10px] text-zinc-500">Игрок {pIdx + 1}</div>
                </div>
                <div className="text-xl font-black text-amber-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                  {player.total_score ?? 0}
                </div>
              </div>

              {/* 10 Frames */}
              {Array.from({ length: 10 }).map((_, fIdx) => {
                const frame = player.frames?.[fIdx] || { roll1: null, roll2: null, score: null };
                const isThisFrame = currentFrame === fIdx + 1 && isCurrentPlayer;

                return (
                  <div
                    key={fIdx}
                    className={`h-14 rounded-lg bg-zinc-900 border flex flex-col justify-between p-1 relative overflow-hidden ${
                      isThisFrame ? "border-amber-500/80 shadow-amber-500/20 shadow-md" : "border-zinc-800/80"
                    }`}
                  >
                    {/* Rolls top sub-grid */}
                    <div className="grid grid-cols-2 h-6 text-center text-xs font-bold border-b border-zinc-800/60 divide-x divide-zinc-800/60">
                      <div className="flex items-center justify-center text-zinc-200">
                        {frame.roll1 !== null && frame.roll1 !== undefined ? String(frame.roll1) : ""}
                      </div>
                      <div className="flex items-center justify-center text-zinc-200">
                        {frame.roll2 !== null && frame.roll2 !== undefined ? String(frame.roll2) : ""}
                      </div>
                    </div>
                    {/* Cumulative score bottom */}
                    <div className="h-6 flex items-center justify-center text-sm font-black text-amber-400 tracking-wider">
                      {frame.score !== null && frame.score !== undefined ? frame.score : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
