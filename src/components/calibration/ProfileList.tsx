/**
 * @file src/components/calibration/ProfileList.tsx
 * @description Список сохраненных профилей калибровки камер с фильтрацией и быстрыми действиями.
 */

import React, { useState, useMemo } from "react";
import type { CalibrationProfile } from "../../api/calibration";
import { formatRelativeTime } from "../../lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { EmptyState } from "../common/EmptyState";
import { ConfirmDialog } from "../common/ConfirmDialog";
import {
  Camera,
  CheckCircle2,
  Trash2,
  Edit,
  Eye,
  Sliders,
  Sparkles,
} from "lucide-react";

export interface ProfileListProps {
  profiles: CalibrationProfile[];
  isLoading: boolean;
  onEdit: (profile: CalibrationProfile) => void;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  isActivating?: boolean;
  isDeleting?: boolean;
}

export function ProfileList({
  profiles,
  isLoading,
  onEdit,
  onActivate,
  onDelete,
  onCreateNew,
  isActivating = false,
  isDeleting = false,
}: ProfileListProps) {
  const [laneFilter, setLaneFilter] = useState<number | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<CalibrationProfile | null>(null);

  // Доступные дорожки для фильтра
  const availableLanes = useMemo(() => {
    const set = new Set(profiles.map((p) => p.lane_id));
    return Array.from(set).sort((a, b) => a - b);
  }, [profiles]);

  // Отфильтрованные профили
  const filteredProfiles = useMemo(() => {
    if (laneFilter === "all") return profiles;
    return profiles.filter((p) => p.lane_id === laneFilter);
  }, [profiles, laneFilter]);

  const getCameraBadge = (type: string) => {
    switch (type) {
      case "tvision":
        return <Badge variant="outline" className="border-sky-500/40 text-sky-400 bg-sky-950/20">T-Vision</Badge>;
      case "pin_deck":
        return <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-950/20">Pin Deck</Badge>;
      case "vdb":
        return <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-950/20">VDB Sensor</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (!isLoading && profiles.length === 0) {
    return (
      <EmptyState
        icon={Sliders}
        title="Профилей калибровки пока нет"
        description="Создайте профиль разметки пиндека для автоматического оптического распознавания сбитых кеглей."
        action={
          <Button
            onClick={onCreateNew}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Создать первый профиль
          </Button>
        }
      />
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
      <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            Конфигурации калибровки ({filteredProfiles.length})
          </CardTitle>
          <div className="text-xs text-zinc-400 mt-0.5">
            Активные профили используются фоновым алгоритмом детекции
          </div>
        </div>

        {/* Фильтр по дорожкам */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={laneFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setLaneFilter("all")}
            className={`h-7 text-xs font-mono ${
              laneFilter === "all"
                ? "bg-emerald-600 text-white"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Все
          </Button>
          {availableLanes.map((laneNum) => (
            <Button
              key={laneNum}
              variant={laneFilter === laneNum ? "default" : "outline"}
              size="sm"
              onClick={() => setLaneFilter(laneNum)}
              className={`h-7 text-xs font-mono ${
                laneFilter === laneNum
                  ? "bg-emerald-600 text-white"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              Д#{laneNum}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent text-xs">
                <TableHead className="w-24">Дорожка</TableHead>
                <TableHead className="w-32">Тип камеры</TableHead>
                <TableHead className="w-28">Статус</TableHead>
                <TableHead className="w-32">Обновлен</TableHead>
                <TableHead>Примечание</TableHead>
                <TableHead className="w-40 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((p) => {
                return (
                  <TableRow
                    key={p.id}
                    className="border-zinc-800/80 hover:bg-zinc-800/40 text-xs font-mono"
                  >
                    {/* Дорожка */}
                    <TableCell className="font-semibold text-zinc-100">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-emerald-400 font-mono">
                          #{p.lane_id}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-sans">
                          (Пара {Math.ceil(p.lane_id / 2)})
                        </span>
                      </div>
                    </TableCell>

                    {/* Тип камеры */}
                    <TableCell>{getCameraBadge(p.camera_type)}</TableCell>

                    {/* Статус активности */}
                    <TableCell>
                      {p.is_active ? (
                        <Badge variant="online" className="gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Активен
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-zinc-500 border-zinc-700/60 text-[11px]">
                          Резерв
                        </Badge>
                      )}
                    </TableCell>

                    {/* Дата */}
                    <TableCell className="text-zinc-400 text-[11px]">
                      {formatRelativeTime(p.updated_at)}
                    </TableCell>

                    {/* Заметки */}
                    <TableCell className="text-zinc-300 font-sans truncate max-w-xs text-xs">
                      {p.notes || <span className="text-zinc-600">—</span>}
                    </TableCell>

                    {/* Действия */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        {!p.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isActivating}
                            onClick={() => onActivate(p.id)}
                            className="h-7 text-[11px] border-emerald-800/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50"
                          >
                            Активировать
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => onEdit(p)}
                          className="h-7 w-7 text-zinc-400 hover:text-white"
                          title="Редактировать разметку"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => setDeleteTarget(p)}
                          className="h-7 w-7 text-zinc-400 hover:text-red-400"
                          title="Удалить профиль"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Диалог подтверждения удаления */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={
            deleteTarget.is_active
              ? "Удалить активный профиль калибровки?"
              : "Удалить профиль калибровки?"
          }
          description={
            deleteTarget.is_active
              ? `ВНИМАНИЕ: Это активный профиль для дорожки #${deleteTarget.lane_id}. Автоматический подсчёт очков для этой дорожки будет приостановлен до назначения нового профиля. Точно удалить?`
              : `Вы действительно хотите удалить профиль ${deleteTarget.id} для дорожки #${deleteTarget.lane_id}?`
          }
          confirmLabel="Удалить профиль"
          variant="destructive"
          isLoading={isDeleting}
          onConfirm={() => {
            if (deleteTarget) {
              onDelete(deleteTarget.id);
              setDeleteTarget(null);
            }
          }}
        />
      )}
    </Card>
  );
}
