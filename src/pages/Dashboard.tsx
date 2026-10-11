import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  List,
  Search,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { getLanes, resetLane } from "../api/lanes";
import { getSettings } from "../api/settings";
import { useUIStore } from "../stores/ui";
import { LaneGrid } from "../components/lane/LaneGrid";
import { LaneGridSkeleton } from "../components/common/LoadingSkeleton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SystemHealth } from "../components/dashboard/SystemHealth";
import type { Lane } from "../api/types";
import { useLaneStatusEvents, useGameEvents } from "../ws/hooks";
import { useOperationMode } from "../stores/operationMode";
import { EmulationControls } from "../components/emulation/EmulationControls";

export function Dashboard() {
  const mode = useOperationMode((s) => s.mode);
  const queryClient = useQueryClient();
  const { viewMode, setViewMode, filter, setFilter, searchQuery, setSearchQuery } =
    useUIStore();

  const [bulkResetOpen, setBulkResetOpen] = useState(false);

  // Fetch settings to monitor changes
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 60000,
  });

  const { lastEvent } = useLaneStatusEvents();
  useEffect(() => {
    if (lastEvent) {
      queryClient.invalidateQueries({ queryKey: ["lanes"] });
    }
  }, [lastEvent, queryClient]);

  useGameEvents();


  // TanStack Query for lanes
  const {
    data: lanes = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<Lane[]>({
    queryKey: ["lanes"],
    queryFn: getLanes,
    refetchInterval: 10000,
  });

  // Bulk reset mutation
  const bulkResetMutation = useMutation({
    mutationFn: async () => {
      // Reset all active or degraded lanes
      const targetLanes = lanes.filter((l) => l.status !== "offline");
      await Promise.all(targetLanes.map((l) => resetLane(l.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lanes"] });
      toast.success("Все доступные дорожки успешно сброшены в исходное положение");
      setBulkResetOpen(false);
    },
    onError: () => {
      toast.error("Произошла ошибка при массовом сбросе дорожек");
    },
  });

  // Filtered & searched lanes
  const filteredLanes = useMemo(() => {
    return lanes.filter((lane: Lane) => {
      // Filter status
      if (filter === "active" && !lane.is_active) return false;
      if (filter === "offline" && lane.status !== "offline") return false;

      // Search query (number or player name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNumber =
          lane.number.toString().includes(query) ||
          (lane.name?.toLowerCase() || "").includes(query);
        const matchesPlayer =
          lane.current_game?.player_name.toLowerCase().includes(query) || false;
        return matchesNumber || matchesPlayer;
      }

      return true;
    });
  }, [lanes, filter, searchQuery]);

  // Statistics
  const totalCount = lanes.length;
  const onlineCount = lanes.filter((l) => l.status === "online").length;
  const activeGamesCount = lanes.filter((l) => l.is_active).length;
  const offlineCount = lanes.filter((l) => l.status === "offline").length;

  const handleLaneUpdated = (updatedLane: Lane) => {
    queryClient.setQueryData<Lane[]>(["lanes"], (old) => {
      if (!old) return [updatedLane];
      return old.map((l) => (l.id === updatedLane.id ? updatedLane : l));
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">
              Дорожки боулинга
            </h1>
            <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              12 пар (24 узла LCom)
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Оперативное управление пинсеттерами, бортиками и игровыми сессиями
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {mode === "emulation" && <EmulationControls />}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-emerald-400" : ""}`}
            />
            {isRefetching ? "Опрос..." : "Опросить шину"}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBulkResetOpen(true)}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Сброс всех
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SystemHealth />
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-400">Всего дорожек</div>
            <div className="text-2xl font-black font-mono text-zinc-100 mt-1">
              {totalCount}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-800/60 text-zinc-300">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-400">В сети (Online)</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {onlineCount}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-400">Идут игры</div>
            <div className="text-2xl font-black font-mono text-sky-400 mt-1">
              {activeGamesCount}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/40">
            <Sparkles className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-400">Офлайн / Ошибки</div>
            <div className="text-2xl font-black font-mono text-red-400 mt-1">
              {offlineCount}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-red-950/60 text-red-400 border border-red-800/40">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Status Filters, View Mode */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/80">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Поиск по номеру дорожки или имени игрока..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-950/70 border-zinc-800 text-sm"
          />
        </div>

        {/* Right: Filter tabs & View toggle */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Status filters */}
          <div className="flex items-center rounded-lg bg-zinc-950/80 p-1 border border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === "all"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Все ({totalCount})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === "active"
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              В игре ({activeGamesCount})
            </button>
            <button
              onClick={() => setFilter("offline")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === "offline"
                  ? "bg-red-950/80 text-red-400 border border-red-800/50 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Офлайн ({offlineCount})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-zinc-950/80 p-1 border border-zinc-800">
            <Button
              variant="ghost"
              size="iconSm"
              className={
                viewMode === "grid"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }
              onClick={() => setViewMode("grid")}
              aria-label="Вид сеткой"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              className={
                viewMode === "list"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }
              onClick={() => setViewMode("list")}
              aria-label="Вид списком"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Lane Content */}
      {isLoading ? (
        <LaneGridSkeleton count={8} />
      ) : (
        <LaneGrid
          lanes={filteredLanes}
          viewMode={viewMode}
          onLaneUpdated={handleLaneUpdated}
        />
      )}

      {/* Bulk Reset Confirm Dialog */}
      <ConfirmDialog
        open={bulkResetOpen}
        onOpenChange={setBulkResetOpen}
        title="Сбросить все дорожки?"
        description="Будет отправлена команда CYCLE_RESET на все подключенные дорожки клуба. Кегли будут циклически подняты и выставлены."
        confirmLabel="Сбросить все дорожки"
        variant="destructive"
        isLoading={bulkResetMutation.isPending}
        onConfirm={() => bulkResetMutation.mutate()}
      />
    </div>
  );
}
