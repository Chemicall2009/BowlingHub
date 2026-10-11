/**
 * @file src/tv/components/TvSplitBadge.tsx
 * @description Split alert badge.
 */

import React from "react";
import { Zap } from "lucide-react";

export const TvSplitBadge: React.FC = () => {
  return (
    <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-600 px-4 py-2 rounded-xl text-amber-400 font-bold text-lg shadow-lg">
      <Zap className="w-6 h-6 animate-pulse" />
      <span>SPLIT</span>
    </div>
  );
};
