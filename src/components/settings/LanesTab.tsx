/**
 * @file src/components/settings/LanesTab.tsx
 * @description Вкладка конфигурации дорожек кеглетранспортера (количество, нумерация пар).
 */

import React from "react";
import { useFormContext } from "react-hook-form";
import { LayoutGrid, AlertCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { SettingsFormValues } from "../../lib/settingsSchema";
import { formatLaneNumber } from "../../lib/format";

export function LanesTab() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<SettingsFormValues>();
  const lanesCount = watch("lanes_count") || 12;
  const startNumber = watch("lanes_start_number") || 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Конфигурация дорожек клуба</h2>
        <p className="text-xs text-zinc-400">Настройка количества активных дорожек и схемы нумерации парных линий.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-zinc-300 font-semibold">Количество дорожек (2 - 48)</Label>
          <Input
            type="number"
            min={2}
            max={48}
            {...register("lanes_count", { valueAsNumber: true })}
            className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
          />
          {errors.lanes_count && <span className="text-[11px] text-red-400">{errors.lanes_count.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-zinc-300 font-semibold">Начальный номер нумерации</Label>
          <Select
            value={startNumber.toString()}
            onValueChange={(val) => setValue("lanes_start_number", parseInt(val, 10) as any, { shouldDirty: true })}
          >
            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="1">С дорожки #1 (1-2, 3-4, ...)</SelectItem>
              <SelectItem value="2">С дорожки #2 (2-3, 4-5, ...)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-amber-950/30 border border-amber-900/60 p-4 rounded-xl flex items-center gap-3 text-xs text-amber-200">
        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
        <span>Изменение количества дорожек требует перезапуска фонового поллера. Сохраните изменения и убедитесь в перезапуске сервиса моста.</span>
      </div>

      {/* Превью сетки дорожек */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-blue-400" /> Превью сгенерированной сетки дорожек ({lanesCount} шт.)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {Array.from({ length: Math.min(lanesCount, 48) }, (_, i) => {
            const laneNum = startNumber + i;
            return (
              <div key={laneNum} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-white">Дорожка #{laneNum}</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                  Пара: {formatLaneNumber(laneNum)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
