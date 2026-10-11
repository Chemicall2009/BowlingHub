/**
 * @file src/pages/Logs.tsx
 * @description Главный экран "Логи" с фильтрами, пагинацией, вкладками и экспортом.
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { useLogsStore } from "../stores/logs";
import { getLogs, type LogSource } from "../api/logs";
import { LogsTabs } from "../components/logs/LogsTabs";
import { LogFilters } from "../components/logs/LogFilters";
import { LogStatsCards } from "../components/logs/LogStatsCards";
import { LogsTable } from "../components/logs/LogsTable";
import { ExportButton } from "../components/logs/ExportButton";
import { ClearLogsButton } from "../components/logs/ClearLogsButton";

export function Logs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, activeTab, pageSize, setFilter, resetFilters, setActiveTab, setPageSize } = useLogsStore();

  const [offset, setOffset] = useState(0);

  // Синхронизация таба из URL при монтировании
  useEffect(() => {
    const tabParam = searchParams.get("tab") as LogSource;
    if (tabParam && ["commands", "traffic", "errors"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const handleTabChange = (tab: LogSource) => {
    setActiveTab(tab);
    setOffset(0);
    setSearchParams({ tab }, { replace: true });
  };

  const { data, isLoading } = useQuery({
    queryKey: ["logs", activeTab, filters, pageSize, offset],
    queryFn: () =>
      getLogs({
        source: activeTab,
        limit: pageSize,
        offset,
        ...filters,
      }),
  });

  const handleLimitChange = (newLimit: number) => {
    setPageSize(newLimit);
    setOffset(0);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 p-4 overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Шапка */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <ScrollText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Журналы событий и трафика</h1>
            <p className="text-xs text-zinc-400">Аудит команд шины, сырого трафика и аварийных сбоев</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton source={activeTab} currentQuery={filters} />
          <ClearLogsButton source={activeTab} />
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex-shrink-0">
        <LogsTabs activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {/* Фильтры */}
      <div className="flex-shrink-0">
        <LogFilters filters={filters} onChange={setFilter} onReset={resetFilters} />
      </div>

      {/* Статистика сверху */}
      <div className="flex-shrink-0">
        <LogStatsCards total={data?.total || 0} />
      </div>

      {/* Таблица */}
      <LogsTable
        source={activeTab}
        data={data}
        isLoading={isLoading}
        limit={pageSize}
        offset={offset}
        onPageChange={setOffset}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}
