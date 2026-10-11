/**
 * @file src/tv/TvLayout.tsx
 * @description Fullscreen kiosk layout for TV Display.
 */

import React from "react";

interface TvLayoutProps {
  children: React.ReactNode;
}

export const TvLayout: React.FC<TvLayoutProps> = ({ children }) => {
  return (
    <div className="w-screen h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white overflow-hidden flex flex-col select-none">
      {children}
    </div>
  );
};
