/**
 * @file src/tv/components/TvHeader.tsx
 * @description Header for TV Display showing lane name, connection, current players.
 */

import React from "react";
import { Wifi, WifiOff, Trophy, Clock } from "lucide-react";

interface TvHeaderProps {
  laneId: number;
  laneDisplay: string;
  isConnected: boolean;
  currentGame: any;
  laneStatus: string;
}

export const TvHeader: React.FC<TvHeaderProps> = ({
  laneId,
  laneDisplay,
  isConnected,
  currentGame,
  laneStatus,
}) => {
  const activePlayers = currentGame?.players || [];
  const currentPlayerIdx = currentGame?.current_player_index ?? 0;
  const currentPlayer = activePlayers[currentPlayerIdx];

  return (
    <header className="w-full bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between text-white shadow-2xl">
      {/* Left: Lane title & connection */}
      <div className="flex items-center space-x-4">
        <div className="bg-amber-500 text-zinc-950 font-black px-4 py-2 rounded-xl text-2xl tracking-wider shadow-lg flex items-center space-x-2">
          <span>ДОРОЖКА {laneId}</span>
          <span className="text-xs font-semibold bg-zinc-950/20 px-2 py-0.5 rounded">
            {laneDisplay}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          {isConnected ? (
            <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-full font-medium">
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span>ОНЛАЙН</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2.5 py-1 rounded-full font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>ПЕРЕПОДКЛЮЧЕНИЕ...</span>
            </span>
          )}
          <span className="text-zinc-500 uppercase px-2 py-0.5 bg-zinc-800/40 rounded">
            Статус: {laneStatus}
          </span>
        </div>
      </div>

      {/* Center: Current active player */}
      <div className="flex items-center space-x-3 bg-zinc-800/60 border border-zinc-700/50 px-6 py-2 rounded-xl">
        <Trophy className="w-5 h-5 text-amber-400" />
        <div className="text-right">
          <div className="text-xs text-zinc-400 uppercase tracking-wide">Сейчас бросает</div>
          <div className="text-lg font-bold text-amber-300">
            {currentPlayer ? currentPlayer.name : "Ожидание игроков"}
          </div>
        </div>
      </div>

      {/* Right: Club brand / time */}
      <div className="text-right flex items-center space-x-3">
        <div className="text-xs text-zinc-400">
          <div className="font-semibold text-zinc-200">BOWLING CLUB</div>
          <div className="text-zinc-500 flex items-center justify-end space-x-1 mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
