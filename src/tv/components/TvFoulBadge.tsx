/**
 * @file src/tv/components/TvFoulBadge.tsx
 * @description Foul alert badge.
 */

import React from "react";
import { AlertTriangle } from "lucide-react";

export const TvFoulBadge: React.FC = () => {
  return (
    <div className="flex items-center gap-2 bg-red-950/80 border border-red-600 px-4 py-2 rounded-xl text-red-400 font-bold text-lg animate-bounce shadow-lg">
      <AlertTriangle className="w-6 h-6" />
      <span>FOUL</span>
    </div>
  );
};
