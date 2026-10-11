/**
 * @file src/components/lane/LaneCard.tsx
 * @description Карточка дорожки боулинга с быстрым управлением и анимацией появления.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Baby,
  KeyboardOff,
  Gauge,
  ArrowLeftRight,
  User,
} from "lucide-react";
import type { MockLane } from "../../mocks/data/lanes";
import { formatLaneNumber } from "../../lib/format";
import { PinTriangle } from "./PinTriangle";
import { LaneStatusBadge } from "./LaneStatusBadge";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { useResetLane, useUpdateLaneOptions } from "../../api/lanes";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface LaneCardProps {
  lane: MockLane;
  onLaneUpdated?: (lane: MockLane) => void;
}

export function LaneCard({ lane, onLaneUpdated }: LaneCardProps) {
  const navigate = useNavigate();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const resetMutation = useResetLane();
  const updateOptionsMutation = useUpdateLaneOptions();

  const handleCardClick = (e: React.MouseEvent) => {
    // Не переходим, если клик был по кнопке или диалогу
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[role='dialog']")) {
      return;
    }
    navigate(`/lane/${lane.id}`);
  };

  const handleResetConfirm = () => {
    resetMutation.mutate(lane.id);
  };

  const handleToggleCosmic = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateOptionsMutation.mutate({
      id: lane.id,
      options: { cosmic: !lane.options.cosmic },
    });
  };

  const handleToggleBambini = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateOptionsMutation.mutate({
      id: lane.id,
      options: { bambini: !lane.options.bambini },
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -2 }}
        className="h-full"
      >
        <Card
          onClick={handleCardClick}
          className="h-full cursor-pointer flex flex-col justify-between overflow-hidden border border-zinc-800 bg-zinc-900/95 hover:border-zinc-700 transition-all shadow-md group"
        >
          {/* Верхняя строка */}
          <div className="p-4 pb-2 border-b border-zinc-800/60 flex items-center justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              {formatLaneNumber(lane.id)}
            </span>
            <LaneStatusBadge status={lane.status} />
          </div>

          {/* Средняя зона */}
          <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <PinTriangle pins={lane.pins} size="sm" />

              <div className="flex-1 min-w-0">
                {lane.current_game ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium truncate">
                      <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{lane.current_game.player_name}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-500 font-mono">
                        Фрейм {lane.current_game.frame}/10
                      </span>
                      <span className="text-xl font-bold font-mono text-emerald-400">
                        {lane.current_game.score}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 italic py-2">
                    {lane.status === "offline"
                      ? "Нет связи с пинсеттером"
                      : "Дорожка свободна"}
                  </div>
                )}
              </div>
            </div>

            {/* Иконки активных опций */}
            <div className="flex items-center gap-1.5 flex-wrap min-h-[20px]">
              {lane.options.bambini && (
                <span
                  title="Детские бортики (Bambini)"
                  className="p-1 rounded bg-sky-950/80 border border-sky-800 text-sky-400 text-[10px] flex items-center gap-1 px-1.5"
                >
                  <Baby className="w-3 h-3" />
                </span>
              )}
              {lane.options.cosmic && (
                <span
                  title="Cosmic-подсветка"
                  className="p-1 rounded bg-violet-950/80 border border-violet-800 text-violet-300 text-[10px] flex items-center gap-1 px-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                </span>
              )}
              {lane.options.kbd_lock && (
                <span
                  title="Блокировка пульта"
                  className="p-1 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] flex items-center gap-1 px-1.5"
                >
                  <KeyboardOff className="w-3 h-3" />
                </span>
              )}
              {lane.options.no_speed && (
                <span
                  title="Радар отключен"
                  className="p-1 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-[10px] flex items-center gap-1 px-1.5"
                >
                  <Gauge className="w-3 h-3" />
                </span>
              )}
              {lane.options.swap_off && (
                <span
                  title="Смена дорожек запрещена"
                  className="p-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] flex items-center gap-1 px-1.5"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </CardContent>

          {/* Низ: 3 кнопки-иконки быстрых действий */}
          <div className="p-3 bg-zinc-950/80 border-t border-zinc-800/60 flex items-center justify-between">
            <TooltipProvider>
              <div className="flex items-center gap-1.5">
                {/* RotateCcw -> сброс с диалогом */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="iconSm"
                      variant="outline"
                      className="hover:bg-amber-600/20 hover:text-amber-400 hover:border-amber-600/40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResetConfirmOpen(true);
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Сброс пинсеттера</TooltipContent>
                </Tooltip>

                {/* Sparkles -> toggle cosmic */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="iconSm"
                      variant={lane.options.cosmic ? "cosmic" : "outline"}
                      onClick={handleToggleCosmic}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {lane.options.cosmic ? "Выключить Cosmic" : "Включить Cosmic"}
                  </TooltipContent>
                </Tooltip>

                {/* ArrowUp/ArrowDown -> toggle bambini */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="iconSm"
                      variant={lane.options.bambini ? "secondary" : "outline"}
                      onClick={handleToggleBambini}
                    >
                      {lane.options.bambini ? (
                        <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {lane.options.bambini ? "Опустить бортики" : "Поднять детские бортики"}
                  </TooltipContent>
                </Tooltip>
              </div>

              <span className="text-[11px] font-medium text-emerald-400 group-hover:underline">
                Открыть →
              </span>
            </TooltipProvider>
          </div>
        </Card>
      </motion.div>

      {/* Диалог подтверждения сброса */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title={`Сбросить дорожку ${formatLaneNumber(lane.id)}?`}
        description="Контроллер LCom переставит все 10 кеглей и сбросит текущие ошибки рамы."
        confirmLabel="Сбросить кегли"
        onConfirm={handleResetConfirm}
      />
    </>
  );
}
