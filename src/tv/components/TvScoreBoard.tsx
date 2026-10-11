/**
 * @file src/tv/components/TvScoreBoard.tsx
 * @description Classic 10-frame bowling scoreboard for all players.
 */

import React from "react";
import { TvGame } from "../types";
import { TvFrameCell } from "./TvFrameCell";

interface TvScoreBoardProps {
  game: TvGame;
}

export const TvScoreBoard: React.FC<TvScoreBoardProps> = ({ game }) => {
  return (
    <div className="w-full bg-zinc-950/90 border-t border-zinc-800 p-4 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {game.players.map((player) => (
          <div
            key={player.name}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
              player.is_current
                ? "bg-zinc-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/30"
                : "bg-zinc-900/40 border-zinc-800/80 opacity-80"
            }`}
          >
            <div className="flex items-center gap-4 min-w-[200px]">
              <div
                className={`w-3 h-3 rounded-full ${
                  player.is_current ? "bg-emerald-500 animate-ping" : "bg-zinc-600"
                }`}
              />
              <span className="font-bold text-lg tracking-wide truncate max-w-[160px]">
                {player.name}
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto">
              {Array.from({ length: 10 }).map((_, fIdx) => {
                const frameNum = fIdx + 1;
                const frameData = player.frames.find((f) => f.frame === frameNum);
                return (
                  <TvFrameCell
                    key={frameNum}
                    frameNum={frameNum}
                    rolls={frameData ? frameData.rolls : [null, null]}
                    cumulative={frameData ? frameData.cumulative : null}
                    isCurrent={player.is_current && game.frame === frameNum}
                  />
                );
              })}
            </div>

            <div className="min-w-[100px] text-right font-mono text-2xl font-black text-emerald-400">
              {player.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
