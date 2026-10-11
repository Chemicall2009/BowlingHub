/**
 * @file src/components/settings/AboutTab.tsx
 * @description Вкладка "О приложении", информация о протоколе и диагностика (экспорт конфига/логов, сброс).
 */

import React, { useState } from "react";
import { Info, Download, RotateCcw, ExternalLink, Code2 } from "lucide-react";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { resetSettings } from "../../api/settings";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AboutTabProps {
  currentValues: any;
}

export function AboutTab({ currentValues }: AboutTabProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const queryClient = useQueryClient();

  const handleDownloadConfig = () => {
    const json = JSON.stringify(currentValues, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lcom_config_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Конфигурация успешно скачана");
  };

  const handleDownloadLogs = () => {
    const mockLogs = Array.from({ length: 50 }, (_, i) => ({
      id: `log_${i}`,
      timestamp: new Date(Date.now() - i * 10000).toISOString(),
      lane_id: (i % 12) + 1,
      cmd: 2,
      cmd_name: "POLL_STATUS",
      raw_hex: "02 01 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 55 A4",
      duration_ms: 18,
      error: null,
    }));
    const json = JSON.stringify(mockLogs, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lcom_command_logs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Последние логи успешно скачаны");
  };

  const handleResetAll = async () => {
    setResetting(true);
    try {
      await resetSettings();
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Все настройки сброшены к значениям по умолчанию");
      window.location.reload();
    } catch {
      toast.error("Не удалось сбросить настройки");
    } finally {
      setResetting(false);
      setResetDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">О программе и Диагностика</h2>
        <p className="text-xs text-zinc-400">Информация о системе управления боулингом, версия протокола и инструменты отладки.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400" /> Сведения о системе
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between">
            <span className="text-zinc-500">Версия ПО:</span>
            <span className="text-zinc-200">v1.2.0-stable</span>
          </div>
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between">
            <span className="text-zinc-500">Протокол LCom:</span>
            <span className="text-zinc-200">Mendes Bowland 1998 (Reversed)</span>
          </div>
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between">
            <span className="text-zinc-500">Архитектура шины:</span>
            <span className="text-zinc-200">RS-485 Half-Duplex</span>
          </div>
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between">
            <span className="text-zinc-500">Стек:</span>
            <span className="text-zinc-200">React 18 + TS + Tailwind + Vite</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline bg-blue-950/40 border border-blue-900/60 px-3 py-1.5 rounded-lg"
          >
            <Code2 className="h-3.5 w-3.5" /> Исходный код репозитория <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white">Диагностика и Сброс</h3>
        <p className="text-xs text-zinc-400">Экспорт текущих дампов состояния для технической поддержки или полный сброс конфигурации.</p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadConfig}
            className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white gap-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" /> Скачать конфиг (JSON)
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadLogs}
            className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white gap-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" /> Скачать логи команд (1000)
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="gap-2 text-xs ml-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Сбросить все настройки
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Сбросить все настройки?"
        description="Конфигурация оборудования, тайминги и параметры шины будут возвращены к заводским значениям по умолчанию. Это действие нельзя отменить."
        confirmLabel="Сбросить настройки"
        variant="destructive"
        onConfirm={handleResetAll}
        isLoading={resetting}
      />
    </div>
  );
}
