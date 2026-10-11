/**
 * @file src/components/emulation/SimulationConfigCard.tsx
 * @description Панель настройки параметров симуляции в Settings (вероятности страйка/спэра, скорость, интервалы).
 */

import React, { useState, useEffect } from "react";
import { Sliders, RotateCcw, Zap, Gauge, Users, Clock, Flame } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useEmulationConfig, useUpdateEmulationConfig } from "../../api/emulation";
import { DEFAULT_SIM_CONFIG, type SimConfig } from "../../mocks/simulation/types";

export const SimulationConfigCard: React.FC = () => {
  const { data: config, isLoading } = useEmulationConfig();
  const updateMutation = useUpdateEmulationConfig();

  const [form, setForm] = useState<SimConfig>(DEFAULT_SIM_CONFIG);

  useEffect(() => {
    if (config && typeof config.throw_interval_ms === "number") {
      setForm((prev) => ({ ...prev, ...config }));
    }
  }, [config]);

  const handleChange = <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const handleResetDefaults = () => {
    setForm(DEFAULT_SIM_CONFIG);
    updateMutation.mutate(DEFAULT_SIM_CONFIG);
  };

  if (isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50 p-6">
        <div className="text-sm text-zinc-400">Загрузка настроек симулятора...</div>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Параметры симуляции боулинг-игры
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Настройка частоты бросков, вероятностей падения кеглей и физики симулятора для режима эмуляции.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            disabled={updateMutation.isPending}
            className="text-xs gap-1.5 border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            По умолчанию
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Интервал между бросками */}
          <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Интервал между бросками (мс)
              </Label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {form.throw_interval_ms} мс ({(form.throw_interval_ms / 1000).toFixed(1)} с)
              </span>
            </div>
            <Input
              type="range"
              min={2000}
              max={20000}
              step={500}
              value={form.throw_interval_ms}
              onChange={(e) => handleChange("throw_interval_ms", Number(e.target.value))}
              className="accent-amber-500 bg-zinc-800 cursor-pointer h-2 p-0"
            />
            <p className="text-[11px] text-zinc-500">
              Периодичность, с которой виртуальные игроки бросают шар на активных дорожках.
            </p>
          </div>

          {/* Игроков в сессии */}
          <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Игроков на дорожке (1..4)
              </Label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {form.players_per_game} чел.
              </span>
            </div>
            <Input
              type="range"
              min={1}
              max={4}
              step={1}
              value={form.players_per_game}
              onChange={(e) => handleChange("players_per_game", Number(e.target.value))}
              className="accent-emerald-500 bg-zinc-800 cursor-pointer h-2 p-0"
            />
            <p className="text-[11px] text-zinc-500">
              Количество случайно выбранных игроков, соревнующихся в создаваемой игре.
            </p>
          </div>

          {/* Вероятность страйка */}
          <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                Вероятность страйка (Strike)
              </Label>
              <span className="text-xs font-mono font-bold text-red-400">
                {Math.round(form.strike_probability * 100)}%
              </span>
            </div>
            <Input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={form.strike_probability}
              onChange={(e) => handleChange("strike_probability", parseFloat(e.target.value))}
              className="accent-red-500 bg-zinc-800 cursor-pointer h-2 p-0"
            />
            <p className="text-[11px] text-zinc-500">
              Шанс сбить все 10 кеглей с первого броска (вызывает анимацию STRIKE на TV-панели).
            </p>
          </div>

          {/* Вероятность спэра */}
          <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Вероятность спэра (Spare)
              </Label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {Math.round(form.spare_probability * 100)}%
              </span>
            </div>
            <Input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={form.spare_probability}
              onChange={(e) => handleChange("spare_probability", parseFloat(e.target.value))}
              className="accent-amber-500 bg-zinc-800 cursor-pointer h-2 p-0"
            />
            <p className="text-[11px] text-zinc-500">
              Шанс добить оставшиеся кегли со второго броска (вызывает анимацию SPARE на TV-панели).
            </p>
          </div>

          {/* Вероятность заступа (Foul) */}
          <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-zinc-300">
                Вероятность заступа (Foul)
              </Label>
              <span className="text-xs font-mono font-bold text-zinc-400">
                {Math.round(form.foul_probability * 100)}%
              </span>
            </div>
            <Input
              type="range"
              min={0}
              max={0.2}
              step={0.01}
              value={form.foul_probability}
              onChange={(e) => handleChange("foul_probability", parseFloat(e.target.value))}
              className="accent-zinc-400 bg-zinc-800 cursor-pointer h-2 p-0"
            />
            <p className="text-[11px] text-zinc-500">
              Вероятность срабатывания фотодатчика фола (0 очков за бросок + индикатор FOUL).
            </p>
          </div>

          {/* Реалистичная скорость шара */}
          <div className="space-y-2 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 cursor-pointer">
                <Gauge className="w-3.5 h-3.5 text-teal-400" />
                Генерировать скорость шара (15..25 км/ч)
              </Label>
              <input
                type="checkbox"
                checked={form.realistic_speed}
                onChange={(e) => handleChange("realistic_speed", e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-teal-500 focus:ring-teal-500 bg-zinc-800"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Вычисление и отображение реалистичной скорости броска на дашборде и TV-панели.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs px-4"
          >
            {updateMutation.isPending ? "Сохранение..." : "Применить параметры"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
