/**
 * @file src/tv/components/TvLoading.tsx
 * @description Loading skeleton for TV display.
 */

import React from "react";
import { Disc3 } from "lucide-react";

export const TvLoading: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-4">
      <Disc3 className="h-12 w-12 animate-spin text-teal-400" />
      <div className="font-mono text-sm tracking-widest uppercase text-zinc-300">
        Загрузка данных ТВ-панели...
      </div>
    </div>
  );
};
