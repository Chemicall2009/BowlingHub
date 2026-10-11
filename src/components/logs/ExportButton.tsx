/**
 * @file src/components/logs/ExportButton.tsx
 * @description Кнопка экспорта логов с выпадающим меню в CSV и JSON.
 */

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { exportLogsBlob, type LogSource } from "../../api/logs";
import { toast } from "sonner";

interface ExportButtonProps {
  source: LogSource;
  currentQuery: any;
}

export function ExportButton({ source, currentQuery }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(true);
    try {
      const blob = await exportLogsBlob({ source, ...currentQuery });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${source}_logs_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Логи успешно экспортированы в ${format.toUpperCase()}`);
    } catch {
      toast.error("Ошибка при экспорте логов");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
          className="gap-2 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white text-xs"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> : <Download className="h-4 w-4" />}
          Экспорт логов
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
        <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2 cursor-pointer focus:bg-zinc-800 text-xs">
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Экспорт в CSV (с фильтрами)
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2 cursor-pointer focus:bg-zinc-800 text-xs">
          <FileJson className="h-4 w-4 text-blue-400" /> Экспорт в JSON (с фильтрами)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
