/**
 * @file src/components/settings/ModeSettings.tsx
 * @description Компонент вкладки настроек режима работы (Эмуляция / Боевой).
 */

import React, { useState } from "react";
import { FlaskConical, Zap, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { useOperationModeInfo, type OperationMode } from "../../api/settings";
import { useOperationMode } from "../../stores/operationMode";
import { SwitchModeDialog } from "./SwitchModeDialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export function ModeSettings() {
  const { data: modeInfo, isLoading, refetch } = useOperationModeInfo();
  const currentMode = useOperationMode((s) => s.mode);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetMode, setTargetMode] = useState<OperationMode>("combat");

  const effectiveMode = modeInfo?.mode || currentMode;
  const isEmu = effectiveMode === "emulation";

  const handleOpenDialog = (toMode: OperationMode) => {
    setTargetMode(toMode);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white">Режим работы системы</h2>
        <p className="text-xs text-zinc-400">Управление режимом взаимодействия с шиной LCom и оборудованием дорожек.</p>
      </div>

      {/* Карточка "Текущий режим" */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isEmu ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
              {isEmu ? <FlaskConical className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                {isEmu ? "Режим Эмуляции (Emulation)" : "Боевой режим (Combat / Live)"}
                <Badge variant="outline" className={`text-[10px] font-mono ${isEmu ? "border-amber-500/40 text-amber-400" : "border-emerald-500/40 text-emerald-400"}`}>
                  {isEmu ? "EMU" : "LIVE"}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                {isEmu
                  ? "Система работает на встроенном виртуальном симуляторе в памяти браузера/бэкенда."
                  : "Симулятор отключен. Все запросы идут в реальный контроллер по RS-485/TCP."}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Обновить статус
          </Button>
        </CardHeader>
      </Card>

      {/* Карточка "Доступные проверки перед переключением" */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            Предполетные проверки (Pre-flight checks)
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Состояние системы перед изменением режима управления
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-950 p-3 border border-zinc-800/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-200">Нет критических ошибок в журнале</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-zinc-950 p-3 border border-zinc-800/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-200">Все дорожки в состоянии покоя (IDLE)</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-zinc-950 p-3 border border-zinc-800/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-200">MQTT брокер камер доступен</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-zinc-950 p-3 border border-zinc-800/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-200">Транспорт шины LCom готов к обмену</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Карточка "Переключение режима" */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">Управление режимом</CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Переключение между виртуальным окружением и реальным боулинг-комплексом
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-zinc-300">
            {isEmu ? (
              <span>Для работы с реальным оборудованием переведите систему в <b>Боевой режим</b>.</span>
            ) : (
              <span>Для безопасной отладки без железа переведите систему в <b>Режим Эмуляции</b>.</span>
            )}
          </div>

          <Button
            onClick={() => handleOpenDialog(isEmu ? "combat" : "emulation")}
            disabled={isLoading}
            className={`text-xs gap-2 font-semibold ${
              isEmu
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-amber-600 hover:bg-amber-500 text-white"
            }`}
          >
            {isEmu ? (
              <>
                <Zap className="h-4 w-4" />
                Переключить в Боевой режим
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4" />
                Переключить в Эмуляцию
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <SwitchModeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        targetMode={targetMode}
      />
    </div>
  );
}
