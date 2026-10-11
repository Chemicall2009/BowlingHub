/**
 * @file src/components/common/TvPanelSelectorModal.tsx
 * @description Модальное окно выбора дорожки для просмотра её TV-панели в киоск-режиме.
 */

import React from "react";
import { Tv, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";

export function TvPanelSelectorModal() {
  const [open, setOpen] = React.useState(false);
  const lanes = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleOpenTv = (laneId: number) => {
    setOpen(false);
    window.open(`/tv/${laneId}`, `_blank`, `width=1280,height=720`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs font-medium bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white"
        >
          <Tv className="h-3.5 w-3.5 text-teal-400" />
          <span>ТВ-панели</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <Tv className="h-5 w-5 text-teal-400" />
            Выбор ТВ-панели дорожки
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Выберите дорожку для открытия её полноэкранной TV-панели в режиме киоска (в новой вкладке).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2.5 py-4">
          {lanes.map((laneId) => (
            <Button
              key={laneId}
              variant="outline"
              onClick={() => handleOpenTv(laneId)}
              className="flex items-center justify-between h-12 bg-zinc-900/80 border-zinc-800 hover:border-teal-500 hover:bg-teal-950/20 text-zinc-200 hover:text-white transition-all text-xs font-medium"
            >
              <span>Дорожка {laneId}</span>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
            </Button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500">
          <span>Общий дашборд ТВ: <a href="/tv" target="_blank" rel="noreferrer" className="text-teal-400 underline">/tv</a></span>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs text-zinc-400">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
