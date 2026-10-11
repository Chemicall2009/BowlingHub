/**
 * @file src/components/logs/LogsTabs.tsx
 * @description Вкладки логов (Команды, Трафик, Ошибки).
 */

import React from "react";
import { Terminal, Radio, AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import type { LogSource } from "../../api/logs";

interface LogsTabsProps {
  activeTab: LogSource;
  onChange: (tab: LogSource) => void;
}

export function LogsTabs({ activeTab, onChange }: LogsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(val) => onChange(val as LogSource)}>
      <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto grid grid-cols-3 gap-1">
        <TabsTrigger value="commands" className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
          <Terminal className="h-3.5 w-3.5 text-blue-400" /> Команды
        </TabsTrigger>
        <TabsTrigger value="traffic" className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
          <Radio className="h-3.5 w-3.5 text-emerald-400" /> Трафик (Rx/Tx)
        </TabsTrigger>
        <TabsTrigger value="errors" className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Ошибки шины
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
