/**
 * @file src/components/lane/ShotTimeline.tsx
 * @description Вертикальная хронология бросков дорожки с индикацией фолов и сплитов.
 */

import { Clock, History } from "lucide-react";
import type { MockShot } from "../../mocks/data/lanes";
import { formatRelativeTime, formatPinMask, formatSpeed } from "../../lib/format";
import { EmptyState } from "../common/EmptyState";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

export interface ShotTimelineProps {
  shots: MockShot[];
  playerName?: string;
}

export function ShotTimeline({ shots = [], playerName }: ShotTimelineProps) {
  if (shots.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Пока нет бросков"
        description="События рамы и попадания шара будут отображаться здесь в реальном времени."
      />
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <CardTitle className="text-sm font-semibold">История бросков</CardTitle>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-zinc-400">
          {shots.length} бросков
        </Badge>
      </CardHeader>
      <CardContent className="p-0 max-h-[420px] overflow-y-auto">
        <div className="divide-y divide-zinc-800/80">
          {shots.map((shot, idx) => {
            const isStrike = shot.pins_down === 10 && shot.shot === 1;

            return (
              <div
                key={shot.id || idx}
                className="p-3.5 hover:bg-zinc-800/30 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                {/* Левая часть: Фрейм и время */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-zinc-200 bg-zinc-800/80 px-2 py-0.5 rounded text-[11px]">
                      Фрейм {shot.frame}, бросок {shot.shot}
                    </span>
                    {isStrike && (
                      <span className="font-bold text-amber-400 text-xs">
                        STRIKE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {formatRelativeTime(shot.timestamp)}
                  </div>
                </div>

                {/* Правая часть: Кегли, скорость, бейджи */}
                <div className="flex items-center gap-3 text-right">
                  <div className="space-y-0.5">
                    <div className="font-mono font-medium text-zinc-200">
                      Сбито:{" "}
                      <span className="font-bold text-white">
                        {formatPinMask(shot.pins_state)}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-zinc-400">
                      Скорость: {formatSpeed(shot.ball_speed)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    {shot.is_foul && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] py-0 px-1.5 font-bold"
                      >
                        Foul
                      </Badge>
                    )}
                    {shot.is_split && (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 border-amber-600 text-amber-400 bg-amber-950/40"
                      >
                        Split
                      </Badge>
                    )}
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
