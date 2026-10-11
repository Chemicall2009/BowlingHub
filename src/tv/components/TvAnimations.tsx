/**
 * @file src/tv/components/TvAnimations.tsx
 * @description Strike, Spare, and Split celebration overlay animations.
 */

import React from "react";
import { Sparkles, Zap, Flame } from "lucide-react";

interface TvAnimationsProps {
  animation: string | null;
}

export const TvAnimations: React.FC<TvAnimationsProps> = ({ animation }) => {
  if (!animation) return null;

  const isStrike = animation.toLowerCase() === "strike";
  const isSpare = animation.toLowerCase() === "spare";
  const isSplit = animation.toLowerCase() === "split";

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative text-center p-12 rounded-3xl bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-amber-500/80 shadow-[0_0_100px_rgba(245,158,11,0.5)] transform animate-bounce">
        {isStrike && (
          <>
            <div className="absolute -top-6 -right-6 animate-pulse">
              <Flame className="w-16 h-16 text-amber-400" />
            </div>
            <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 tracking-wider mb-4 drop-shadow-2xl">
              СТРАЙК!
            </div>
            <div className="text-xl md:text-2xl text-zinc-300 font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>Все кегли сбиты с первого броска!</span>
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
          </>
        )}

        {isSpare && (
          <>
            <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-500 tracking-wider mb-4 drop-shadow-2xl">
              СПЕЙР!
            </div>
            <div className="text-xl md:text-2xl text-zinc-300 font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
              <Zap className="w-6 h-6 text-emerald-400" />
              <span>Отличная зачистка со второго броска!</span>
            </div>
          </>
        )}

        {isSplit && (
          <>
            <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-500 to-orange-600 tracking-wider mb-4 drop-shadow-2xl">
              СПЛИТ!
            </div>
            <div className="text-xl md:text-2xl text-zinc-300 font-bold uppercase tracking-widest">
              Сложная расстановка кеглей
            </div>
          </>
        )}

        {!isStrike && !isSpare && !isSplit && (
          <div className="text-5xl md:text-7xl font-black text-amber-400 uppercase tracking-wider">
            {animation}
          </div>
        )}
      </div>
    </div>
  );
};
