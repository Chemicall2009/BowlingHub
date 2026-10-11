/**
 * @file src/tv/components/TvBigScore.tsx
 * @description Giant score display with gradient when score > 200.
 */

import React from "react";
import { motion } from "framer-motion";

interface TvBigScoreProps {
  score: number;
}

export const TvBigScore: React.FC<TvBigScoreProps> = ({ score }) => {
  const isHighscore = score >= 200;

  return (
    <motion.div
      key={score}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center p-6 bg-zinc-900/60 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-lg"
    >
      <span className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-1">Счёт матча</span>
      <span
        className={`text-8xl font-black font-mono tracking-tight ${
          isHighscore
            ? "bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(251,191,36,0.4)]"
            : "text-emerald-400 drop-shadow-[0_10px_20px_rgba(16,185,129,0.3)]"
        }`}
      >
        {score}
      </span>
    </motion.div>
  );
};
