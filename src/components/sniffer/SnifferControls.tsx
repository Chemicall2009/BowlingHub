/**
 * @file src/components/sniffer/SnifferControls.tsx
 * @description Панель управления сниффером (Start/Stop, Pause/Resume, Clear, Baud selector).
 */

import React, { useState } from "react";
import { Play, Square, Pause, Trash2, Radio } from "lucide-react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { startSniffer, stopSniffer } from "../../api/sniffer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SnifferControlsProps {
  isRunning: boolean;
  paused: boolean;
  onTogglePause: (paused: boolean) => void;
  onClear: () => void;
  baud: number;
  onBaudChange: (baud: number) => void;
}

export function SnifferControls({
  isRunning,
  paused,
  onTogglePause,
  onClear,
  baud,
  onBaudChange,
}: SnifferControlsProps) {
  const [confirmStopOpen, setConfirmStopOpen] = useState(false);
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: startSniffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sniffer-status"] });
      toast.success("Сниффер запущен");
    },
    onError: () => {
      toast.error("Не удалось запустить сниффер");
    },
  });

  const stopMutation = useMutation({
    mutationFn: stopSniffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sniffer-status"] });
      toast.success("Сниффер остановлен");
    },
    onError: () => {
      toast.error("Не удалось остановить сниффер");
    },
  });

  const handleStartStop = () => {
    if (isRunning) {
      setConfirmStopOpen(true);
    } else {
      startMutation.mutate();
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <Button
          variant={isRunning ? "destructive" : "default"}
          size="sm"
          className="gap-2 font-medium"
          onClick={handleStartStop}
          disabled={startMutation.isPending || stopMutation.isPending}
        >
          {isRunning ? (
            <>
              <Square className="h-4 w-4 fill-current" /> Остановить
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" /> Запустить
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white"
          onClick={() => onTogglePause(!paused)}
        >
          {paused ? (
            <>
              <Play className="h-4 w-4 text-emerald-400" /> Возобновить
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 text-amber-400" /> Пауза
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white"
          onClick={onClear}
          title="Очистить лог"
        >
          <Trash2 className="h-4 w-4 text-zinc-400" /> Очистить
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Radio className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
          <span>Скорость:</span>
        </div>
        <Select value={baud.toString()} onValueChange={(val) => onBaudChange(parseInt(val, 10))}>
          <SelectTrigger className="h-8 w-[110px] bg-zinc-950 border-zinc-800 text-zinc-200 text-xs">
            <SelectValue placeholder="Baud rate" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
            <SelectItem value="9600">9600 бод</SelectItem>
            <SelectItem value="19200">19200 бод</SelectItem>
            <SelectItem value="38400">38400 бод</SelectItem>
            <SelectItem value="57600">57600 бод</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ConfirmDialog
        open={confirmStopOpen}
        onOpenChange={setConfirmStopOpen}
        title="Остановить сниффер шины?"
        description="Трафик LCom перестанет записываться в буфер. Вы уверены, что хотите остановить захват?"
        confirmLabel="Остановить"
        variant="destructive"
        onConfirm={() => stopMutation.mutate()}
        isLoading={stopMutation.isPending}
      />
    </div>
  );
}
