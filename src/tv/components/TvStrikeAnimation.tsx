/**
 * @file src/tv/components/TvStrikeAnimation.tsx
 * @description Fullscreen STRIKE celebration animation with stars/sparkles.
 */

import React from "react";
import { Sparkles, Flame } from "lucide-react";
import { motion } from "framer-motion";

export const TvStrikeAnimation: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md pointer-events-none"
    >
      <div className="relative flex items-center justify-center">
        {/* 12 sparkling stars/sparkles around */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 360;
          const radius = 180;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{ x, y, opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className="absolute text-amber-400"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
          );
        })}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-4 text-amber-400 mb-2">
            <Flame className="w-16 h-16 animate-pulse text-orange-500" />
            <span className="text-8xl font-black tracking-wider uppercase font-mono bg-gradient-to-r from-amber-300 via-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(251,191,36,0.5)]">
              STRIKE!
            </span>
            <Flame className="w-16 h-16 animate-pulse text-orange-500" />
          </div>
          <p className="text-2xl text-zinc-300 font-medium">Великолепный бросок!</p>
        </motion.div>
      </div>
    </motion.div>
  );
};
