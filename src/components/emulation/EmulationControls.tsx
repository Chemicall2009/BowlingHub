/**
 * @file src/components/emulation/EmulationControls.tsx
 * @description Панель быстрого управления симуляцией боулинг-клуба (Запуск всех дорожек, пауза, стоп, сброс).
 */

import React from "react";
import { PlayCircle, Pause, StopCircle, RotateCcw, Activity } from "lucide-react";
import { Button } from "../ui/button";
import { useOperationMode } from "../../stores/operationMode";
import {
  useEmulationStatus,
  useStartEmulation,
  useStopEmulation,
  usePauseEmulation,
  useResumeEmulation,
} from "../../api/emulation";

export const EmulationControls: React.FC = () => {
  const mode = useOperationMode((s) => s.mode);
  const { data: status } = useEmulationStatus();
  const startMutation = useStartEmulation();
  const stopMutation = useStopEmulation();
  const pauseMutation = usePauseEmulation();
  const resumeMutation = useResumeEmulation();

  if (mode !== "emulation") return null;

  const activeCount = Array.isArray(status?.active_lanes) ? status.active_lanes.length : 0;
  const isRunning = activeCount > 0;

  return (
    <div className="flex items-center gap-2.5 p-2 px-3 rounded-xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-sm">
      <div className="flex items-center gap-2 mr-1">
        <span className="relative flex h-2.5 w-2.5">
          {isRunning && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isRunning ? "bg-emerald-400" : "bg-zinc-500"
            }`}
          />
        </span>
        <div className="hidden sm:flex flex-col">
          <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-amber-300">
            Эмуляция
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {isRunning ? `${activeCount} дорожек играют` : "Остановлена"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => startMutation.mutate(undefined)}
          disabled={startMutation.isPending}
          className="text-xs h-7 px-2.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
          title="Запустить автоигру на всех 12 дорожках"
        >
          <PlayCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
          Запустить всё
        </Button>

        {isRunning ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => pauseMutation.mutate(undefined)}
            disabled={pauseMutation.isPending}
            className="text-xs h-7 px-2.5 border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            title="Приостановить броски"
          >
            <Pause className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Пауза
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => resumeMutation.mutate(undefined)}
            disabled={resumeMutation.isPending}
            className="text-xs h-7 px-2.5 border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            title="Возобновить броски"
          >
            <Activity className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Продолжить
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => stopMutation.mutate(undefined)}
          disabled={stopMutation.isPending}
          className="text-xs h-7 px-2.5 border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          title="Остановить симуляцию"
        >
          <StopCircle className="w-3.5 h-3.5 mr-1 text-red-400" />
          Стоп
        </Button>
      </div>
    </div>
  );
};
