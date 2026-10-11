/**
 * @file src/components/logs/LogFilters.tsx
 * @description Панель фильтрации логов с синхронизацией по URL query params.
 */

import React from "react";
import { Search, RotateCcw, Filter, Calendar } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { LogsFilterState } from "../../stores/logs";
import { CMD_RESET_LANE, CMD_POLL_STATUS, CMD_UPLOAD_DATA, CMD_MACHINE_CTRL, CMD_STATUS_OK, cmdName } from "../../lib/lcom";

interface LogFiltersProps {
  filters: LogsFilterState;
  onChange: (filter: Partial<LogsFilterState>) => void;
  onReset: () => void;
}

export function LogFilters({ filters, onChange, onReset }: LogFiltersProps) {
  const setPreset = (days: number | null) => {
    if (days === null) {
      onChange({ from: undefined, to: undefined });
    } else {
      const to = new Date().toISOString();
      const from = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
      onChange({ from, to });
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <Filter className="h-4 w-4 text-blue-400" />
          <span>Фильтры и поиск по логам</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-white" onClick={() => setPreset(1)}>
            Сегодня
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-white" onClick={() => setPreset(7)}>
            7 дней
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-white" onClick={() => setPreset(30)}>
            30 дней
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-white" onClick={() => setPreset(null)}>
            Всё время
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1 ml-2"
            onClick={onReset}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Сброс
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-center">
        {/* Дорожка */}
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-zinc-400">Дорожка</Label>
          <Select
            value={filters.lane_id === "all" ? "all" : filters.lane_id.toString()}
            onValueChange={(val) => onChange({ lane_id: val === "all" ? "all" : parseInt(val, 10) })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-zinc-200 text-xs">
              <SelectValue placeholder="Все дорожки" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-h-56">
              <SelectItem value="all">Все дорожки</SelectItem>
              {Array.from({ length: 48 }, (_, i) => i + 1).map((id) => (
                <SelectItem key={id} value={id.toString()}>
                  Дорожка #{id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Команда */}
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-zinc-400">Команда</Label>
          <Select
            value={filters.cmd === "all" ? "all" : filters.cmd.toString()}
            onValueChange={(val) => onChange({ cmd: val === "all" ? "all" : parseInt(val, 10) })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-zinc-200 text-xs">
              <SelectValue placeholder="Все команды" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="all">Все команды</SelectItem>
              <SelectItem value={CMD_POLL_STATUS.toString()}>{cmdName(CMD_POLL_STATUS)}</SelectItem>
              <SelectItem value={CMD_STATUS_OK.toString()}>{cmdName(CMD_STATUS_OK)}</SelectItem>
              <SelectItem value={CMD_RESET_LANE.toString()}>{cmdName(CMD_RESET_LANE)}</SelectItem>
              <SelectItem value={CMD_UPLOAD_DATA.toString()}>{cmdName(CMD_UPLOAD_DATA)}</SelectItem>
              <SelectItem value={CMD_MACHINE_CTRL.toString()}>{cmdName(CMD_MACHINE_CTRL)}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Направление */}
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-zinc-400">Направление</Label>
          <Select
            value={filters.direction}
            onValueChange={(val) => onChange({ direction: val as any })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-zinc-200 text-xs">
              <SelectValue placeholder="Все" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="rx">RX</SelectItem>
              <SelectItem value="tx">TX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Поиск */}
        <div className="flex flex-col gap-1 md:col-span-3">
          <Label className="text-[11px] text-zinc-400">Текстовый поиск / HEX</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <Input
              placeholder="Поиск по деталям, hex или имени..."
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              className="h-8 pl-8 bg-zinc-950 border-zinc-800 text-zinc-200 text-xs placeholder:text-zinc-600"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
        <Switch
          id="only-errs"
          checked={filters.only_errors}
          onCheckedChange={(checked) => onChange({ only_errors: checked })}
        />
        <Label htmlFor="only-errs" className="text-xs text-zinc-300 cursor-pointer">
          Только записи с ошибками / сбоями CRC
        </Label>
      </div>
    </div>
  );
}
