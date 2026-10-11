import { useNavigate } from "react-router-dom";
import { LaneCard } from "./LaneCard";
import { LaneStatusBadge } from "./LaneStatusBadge";
import { PinTriangle } from "./PinTriangle";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { EmptyState } from "../common/EmptyState";
import { Layers, User, Gauge } from "lucide-react";
import type { Lane } from "../../api/types";
import type { ViewMode } from "../../stores/ui";

interface LaneGridProps {
  lanes: Lane[];
  viewMode: ViewMode;
  onLaneUpdated?: (lane: Lane) => void;
}

export function LaneGrid({ lanes, viewMode, onLaneUpdated }: LaneGridProps) {
  const navigate = useNavigate();

  if (lanes.length === 0) {
    return (
      <EmptyState
        title="Дорожки не найдены"
        description="По заданным фильтрам или поисковому запросу ничего не найдено."
      />
    );
  }

  if (viewMode === "list") {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-20">Дорожка</TableHead>
              <TableHead className="w-24">Пара</TableHead>
              <TableHead className="w-32">Статус</TableHead>
              <TableHead>Игрок / Сессия</TableHead>
              <TableHead className="w-28 text-center">Счёт</TableHead>
              <TableHead className="w-32 text-center">Кегли</TableHead>
              <TableHead className="w-28 text-center">Скорость</TableHead>
              <TableHead className="w-28 text-right">Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lanes.map((lane) => {
              const standingCount = lane.pins.filter(Boolean).length;
              return (
                <TableRow
                  key={lane.id}
                  onClick={() => navigate(`/lane/${lane.id}`)}
                  className="cursor-pointer border-zinc-800/60 hover:bg-zinc-800/50 transition-colors"
                >
                  <TableCell className="font-mono font-bold text-lg text-emerald-400">
                    #{lane.number}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-xs font-mono">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Пара {lane.pair_number}
                    </span>
                  </TableCell>
                  <TableCell>
                    <LaneStatusBadge status={lane.status} />
                  </TableCell>
                  <TableCell>
                    {lane.current_game ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-400" />
                        <div>
                          <div className="text-sm font-medium text-zinc-200">
                            {lane.current_game.player_name}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            Фрейм {lane.current_game.current_frame}/10
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500 italic">Свободна</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-base text-zinc-200">
                    {lane.current_game ? lane.current_game.score : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <PinTriangle pins={lane.pins} size="sm" className="w-12 h-12 p-1" />
                      <span className="font-mono text-xs text-zinc-300">
                        {standingCount}/10
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-zinc-400">
                    {lane.speed ? (
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-sky-400" />
                        {lane.speed.toFixed(1)} км/ч
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-400 hover:text-emerald-300 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lane/${lane.id}`);
                      }}
                    >
                      Открыть →
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {lanes.map((lane) => (
        <LaneCard key={lane.id} lane={lane} onLaneUpdated={onLaneUpdated} />
      ))}
    </div>
  );
}
