/**
 * @file src/components/sniffer/FrameFilters.tsx
 * @description Панель фильтрации кадров LCom по направлению, дорожке, команде, ошибкам и хекс-поиску.
 */

import React from "react";
import { Search, RotateCcw, Filter } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { FrameFilter } from "../../api/sniffer";
import { CMD_RESET_LANE, CMD_POLL_STATUS, CMD_UPLOAD_DATA, CMD_MACHINE_CTRL, CMD_STATUS_OK, cmdName } from "../../lib/lcom";

interface FrameFiltersProps {
  filter: FrameFilter;
  onChange: (filter: Partial<FrameFilter>) => void;
  onReset: () => void;
}

export function FrameFilters({ filter, onChange, onReset }: FrameFiltersProps) {
  return (
    <div className="bg-zinc-900/95 border border-zinc-800 p-3.5 rounded-lg flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <Filter className="h-4 w-4 text-blue-400" />
          <span>Фильтрация трафика</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1.5"
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Сбросить фильтры
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
        {/* Направление */}
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-zinc-400">Направление</Label>
          <Select
            value={filter.direction}
            onValueChange={(val) => onChange({ direction: val as FrameFilter["direction"] })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-zinc-200 text-xs">
              <SelectValue placeholder="Все" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="all">Все направления</SelectItem>
              <SelectItem value="rx">RX (Вход)</SelectItem>
              <SelectItem value="tx">TX (Выход)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Дорожка */}
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-zinc-400">Дорожка</Label>
          <Select
            value={filter.lane_id === "all" ? "all" : filter.lane_id.toString()}
            onValueChange={(val) => onChange({ lane_id: val === "all" ? "all" : parseInt(val, 10) })}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-zinc-200 text-xs">
              <SelectValue placeholder="Все дорожки" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-h-56">
              <SelectItem value="all">Все дорожки (1-48)</SelectItem>
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
            value={filter.cmd === "all" ? "all" : filter.cmd.toString()}
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

        {/* Поиск по Hex */}
        <div className="flex flex-col gap-1 md:col-span-3">
          <Label className="text-[11px] text-zinc-400">Поиск по HEX</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <Input
              placeholder="Например: 02 01 AA..."
              value={filter.search}
              onChange={(e) => onChange({ search: e.target.value })}
              className="h-8 pl-8 bg-zinc-950 border-zinc-800 text-zinc-200 text-xs placeholder:text-zinc-600"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-1 border-t border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Switch
            id="only-errors"
            checked={filter.only_errors}
            onCheckedChange={(checked) => onChange({ only_errors: checked })}
          />
          <Label htmlFor="only-errors" className="text-xs text-zinc-300 cursor-pointer">
            Только ошибки
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="only-bad-crc"
            checked={filter.only_checksum_bad}
            onCheckedChange={(checked) => onChange({ only_checksum_bad: checked })}
          />
          <Label htmlFor="only-bad-crc" className="text-xs text-zinc-300 cursor-pointer">
            Только неверный CRC
          </Label>
        </div>
      </div>
    </div>
  );
}
