/**
 * @file src/tv/TvApp.tsx
 * @description Main TV App component rendering scoreboard, pins, speed, foul/split badges, and animations for a lane using useTvData polling hook.
 */

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTvData } from "./hooks/useTvData";
import { TvLoading } from "./components/TvLoading";
import { TvLayout } from "./TvLayout";
import { TvHeader } from "./components/TvHeader";
import { TvPinTriangle } from "./components/TvPinTriangle";
import { TvScoreBoard } from "./components/TvScoreBoard";
import { TvBigScore } from "./components/TvBigScore";
import { TvShotIndicator } from "./components/TvShotIndicator";
import { TvSpeedBadge } from "./components/TvSpeedBadge";
import { TvFoulBadge } from "./components/TvFoulBadge";
import { TvSplitBadge } from "./components/TvSplitBadge";
import { TvStrikeAnimation } from "./components/TvStrikeAnimation";
import { TvSpareAnimation } from "./components/TvSpareAnimation";
import { TvOffline } from "./components/TvOffline";
import { TvIdle } from "./components/TvIdle";
import { AnimatePresence } from "framer-motion";

export const TvApp: React.FC = () => {
  const { laneId: laneIdParam } = useParams<{ laneId: string }>();
  const laneId = parseInt(laneIdParam || "1", 10);

  const { snapshot, isLoading, isError } = useTvData(laneId);

  const [activeAnimation, setActiveAnimation] = useState<"strike" | "spare" | null>(null);
  const prevScoreRef = useRef<number>(0);

  useEffect(() => {
    if (!snapshot || !snapshot.current_game) return;
    const currentScore = snapshot.current_game.score;
    const pins = snapshot.pins;
    const downCount = pins.filter((p) => !p).length;
    if (downCount === 10 && prevScoreRef.current !== currentScore) {
      setActiveAnimation("strike");
      const timer = setTimeout(() => setActiveAnimation(null), 3000);
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = currentScore;
  }, [snapshot]);

  if (isLoading || !snapshot) return <TvLoading />;
  if (isError) return <TvOffline />;

  const currentGame = snapshot.current_game;
  const isOffline = snapshot.lane_status === "offline";
  const isIdle = !currentGame || currentGame.players.length === 0;

  return (
    <TvLayout>
      <TvHeader
        laneId={laneId}
        laneDisplay={snapshot.lane_display}
        isConnected={!isOffline}
        currentGame={currentGame}
        laneStatus={snapshot.lane_status}
      />

      {isOffline && <TvOffline />}

      <AnimatePresence>
        {activeAnimation === "strike" && <TvStrikeAnimation />}
        {activeAnimation === "spare" && <TvSpareAnimation />}
      </AnimatePresence>

      {isIdle ? (
        <TvIdle laneDisplay={snapshot.lane_display} />
      ) : (
        <div className="flex-1 flex flex-col justify-between p-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-4 items-start justify-center w-full">
              <TvShotIndicator shotNumber={currentGame?.shot_in_frame || 1} />
              <TvSpeedBadge speedKmh={snapshot.speed_kmh} />
              {snapshot.foul1 && <TvFoulBadge />}
              {snapshot.split && <TvSplitBadge />}
            </div>

            <div className="flex flex-col items-center justify-center">
              <TvPinTriangle pins={snapshot.pins} />
            </div>

            <div className="flex flex-col items-end justify-center w-full">
              <TvBigScore score={currentGame?.score || 0} />
            </div>
          </div>

          <TvScoreBoard game={currentGame} />
        </div>
      )}
    </TvLayout>
  );
};
