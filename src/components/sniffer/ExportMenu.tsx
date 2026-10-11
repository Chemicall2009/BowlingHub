/**
 * @file src/components/sniffer/ExportMenu.tsx
 * @description Меню экспорта кадров сниффера в CSV и JSON.
 */

import React from "react";
import { Download, FileSpreadsheet, FileJson } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { exportToCsv, type SnifferFrame } from "../../api/sniffer";
import { toast } from "sonner";

interface ExportMenuProps {
  filteredFrames: SnifferFrame[];
  allFrames: SnifferFrame[];
}

export function ExportMenu({ filteredFrames, allFrames }: ExportMenuProps) {
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Файл ${filename} успешно скачан`);
  };

  const handleExportFilteredCsv = () => {
    const csv = exportToCsv(filteredFrames);
    downloadFile(csv, `sniffer_filtered_${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  const handleExportAllCsv = () => {
    const csv = exportToCsv(allFrames);
    downloadFile(csv, `sniffer_all_${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  const handleExportFilteredJson = () => {
    const json = JSON.stringify(filteredFrames, null, 2);
    downloadFile(json, `sniffer_filtered_${Date.now()}.json`, "application/json");
  };

  const handleExportAllJson = () => {
    const json = JSON.stringify(allFrames, null, 2);
    downloadFile(json, `sniffer_all_${Date.now()}.json`, "application/json");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white text-xs"
        >
          <Download className="h-4 w-4" /> Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
        <DropdownMenuItem onClick={handleExportFilteredCsv} className="gap-2 cursor-pointer focus:bg-zinc-800 text-xs">
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Экспорт отфильтрованных в CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportAllCsv} className="gap-2 cursor-pointer focus:bg-zinc-800 text-xs">
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Экспорт всего буфера в CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem onClick={handleExportFilteredJson} className="gap-2 cursor-pointer focus:bg-zinc-800 text-xs">
          <FileJson className="h-4 w-4 text-blue-400" /> Экспорт отфильтрованных в JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportAllJson} className="gap-2 cursor-pointer focus:bg-zinc-800 text-xs">
          <FileJson className="h-4 w-4 text-blue-400" /> Экспорт всего буфера в JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
