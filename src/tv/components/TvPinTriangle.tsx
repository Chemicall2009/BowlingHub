/**
 * @file src/tv/components/TvPinTriangle.tsx
 * @description Real-time bowling pin triangle visualization (pins 1-10) with smooth transitions.
 */

import React from "react";
import { motion } from "framer-motion";

interface TvPinTriangleProps {
  pins: boolean[]; // array of 10 booleans (true = standing, false = knocked down)
}

export const TvPinTriangle: React.FC<TvPinTriangleProps> = ({ pins }) => {
  // Bowling pin rows layout:
  // Row 1: [1] (Index 0)
  // Row 2: [2, 3] (Indices 1, 2)
  // Row 3: [4, 5, 6] (Indices 3, 4, 5)
  // Row 4: [7, 8, 9, 10] (Indices 6, 7, 8, 9)
  const rows = [
    [0],
    [1, 2],
    [3, 4, 5],
    [6, 7, 8, 9],
  ];

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/60 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-lg">
      <span className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Состояние кеглей</span>
      <div className="flex flex-col items-center gap-3">
        {rows.map((rowPins, rIdx) => (
          <div key={rIdx} className="flex gap-4">
            {rowPins.map((pinIdx) => {
              const isStanding = pins[pinIdx] ?? true;
              return (
                <motion.div
                  key={pinIdx}
                  layout
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm shadow-md transition-all ${
                    isStanding
                      ? "bg-gradient-to-t from-zinc-100 to-white text-zinc-950 ring-4 ring-emerald-500/50 shadow-emerald-500/30"
                      : "bg-zinc-800 text-zinc-600 border border-zinc-700/50 opacity-40"
                  }`}
                >
                  <span className="z-10">{pinIdx + 1}</span>
                  {isStanding && (
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-sm animate-pulse" />
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
