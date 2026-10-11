/**
 * @file src/tv/components/TvOffline.tsx
 * @description Red overlay displayed when lane is offline or disconnected.
 */

import React from "react";
import { WifiOff } from "lucide-react";

export const TvOffline: React.FC = () => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md text-red-200">
      <WifiOff className="w-24 h-24 mb-6 animate-pulse text-red-500" />
      <h1 className="text-5xl font-black mb-2 uppercase tracking-wider">Связь потеряна</h1>
      <p className="text-xl text-red-300 font-mono">Переподключение к дорожке...</p>
    </div>
  );
};
