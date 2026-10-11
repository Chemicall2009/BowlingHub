/**
 * @file src/tv/components/TvIdle.tsx
 * @description Idle waiting screen when no active game is running on the lane.
 */

import React from "react";
import { Trophy, Disc } from "lucide-react";

interface TvIdleProps {
  laneDisplay: string;
}

export const TvIdle: React.FC<TvIdleProps> = ({ laneDisplay }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <div className="relative mb-8">
        <Disc className="w-32 h-32 text-emerald-500 animate-spin duration-3000 opacity-80" />
        <Trophy className="absolute inset-0 m-auto w-16 h-16 text-amber-400" />
      </div>
      <h1 className="text-6xl font-black mb-4 tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
        Дорожка {laneDisplay} свободна
      </h1>
      <p className="text-2xl text-zinc-400 font-medium">Ожидание начала новой игры...</p>
    </div>
  );
};
