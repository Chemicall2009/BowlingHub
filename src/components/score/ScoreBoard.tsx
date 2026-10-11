import { User } from "lucide-react";
import { FrameCell } from "./FrameCell";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import type { PlayerScore, FrameScore } from "../../api/types";

interface ScoreBoardProps {
  players?: (PlayerScore | string)[];
  currentFrame?: number;
}

export function ScoreBoard({ players = [], currentFrame = 1 }: ScoreBoardProps) {
  if (!players || players.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
        <CardContent className="p-8 text-center text-zinc-500">
          Игра ещё не начата. Нажмите "Начать игру" для запуска сетки 10 фреймов.
        </CardContent>
      </Card>
    );
  }

  // Normalize input players to ensure robust structure with all 10 frames
  const normalizedPlayers: PlayerScore[] = players.map((p, index) => {
    if (typeof p === "string") {
      return {
        id: `p-${index}-${p}`,
        name: p,
        is_current: index === 0,
        total_score: 0,
        frames: Array.from({ length: 10 }, (_, i) => ({
          frame: i + 1,
          rolls: [],
          score: null,
        })),
      };
    }

    const existingFrames: FrameScore[] = Array.isArray(p?.frames) ? p.frames : [];
    const completeFrames: FrameScore[] = Array.from({ length: 10 }, (_, i) => {
      const frameNum = i + 1;
      const found = existingFrames.find((f) => f && f.frame === frameNum);
      if (found) return found;
      return {
        frame: frameNum,
        rolls: [],
        score: null,
      };
    });

    return {
      id: p?.id || `p-${index}`,
      name: p?.name || `Игрок ${index + 1}`,
      is_current: p?.is_current ?? index === 0,
      total_score: p?.total_score ?? 0,
      frames: completeFrames,
    };
  });

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base font-semibold">Таблица счёта (10 Фреймов)</CardTitle>
          <Badge variant="online" className="text-xs">
            Активная сессия
          </Badge>
        </div>
        <div className="text-xs text-zinc-400 font-mono">
          Текущий фрейм: <span className="text-emerald-400 font-bold">{currentFrame}</span>/10
        </div>
      </CardHeader>

      <CardContent className="p-4 overflow-x-auto">
        <div className="min-w-[850px] space-y-3">
          {normalizedPlayers.map((player) => {
            return (
              <div
                key={player.id}
                className={`flex items-center rounded-xl border p-2.5 transition-all ${
                  player.is_current
                    ? "border-emerald-600/70 bg-emerald-950/20 shadow-md"
                    : "border-zinc-800 bg-zinc-950/40"
                }`}
              >
                {/* Player Header */}
                <div className="w-48 shrink-0 pr-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        player.is_current
                          ? "bg-emerald-400 animate-pulse ring-2 ring-emerald-400/40"
                          : "bg-zinc-600"
                      }`}
                    />
                    <span className="font-semibold text-sm text-zinc-100 truncate">
                      {player.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 font-mono">
                    <User className="w-3 h-3 text-zinc-500" />
                    {player.is_current ? (
                      <span className="text-emerald-400 font-medium">Текущий ход</span>
                    ) : (
                      "Ожидает"
                    )}
                  </div>
                </div>

                {/* 10 Frames */}
                <div className="flex items-center gap-1 flex-1">
                  {Array.from({ length: 10 }, (_, i) => {
                    const frameNum = i + 1;
                    const frameData = player?.frames?.find((f) => f && f.frame === frameNum);
                    const isCurrentCell = player?.is_current && currentFrame === frameNum;

                    return (
                      <FrameCell
                        key={frameNum}
                        frameNumber={frameNum}
                        frameData={frameData}
                        isCurrent={isCurrentCell}
                      />
                    );
                  })}
                </div>

                {/* Total Score Column */}
                <div className="w-24 shrink-0 pl-3 text-right">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    Итого
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {player.total_score}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
