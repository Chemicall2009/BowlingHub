/**
 * @file src/components/calibration/ProfileFormDialog.tsx
 * @description Модальное окно создания и редактирования метаданных профиля калибровки.
 */

import React, { useState, useEffect } from "react";
import type {
  CalibrationProfile,
  CalibrationCameraType,
  CreateProfileDto,
} from "../../api/calibration";
import { CameraTypeSelect } from "./CameraTypeSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

export interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProfile?: CalibrationProfile | null;
  onSubmit: (data: CreateProfileDto & { id?: string }) => void;
  isLoading?: boolean;
}

export function ProfileFormDialog({
  open,
  onOpenChange,
  initialProfile,
  onSubmit,
  isLoading = false,
}: ProfileFormDialogProps) {
  const [laneId, setLaneId] = useState<number>(1);
  const [cameraType, setCameraType] = useState<CalibrationCameraType>("tvision");
  const [notes, setNotes] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (initialProfile) {
      setLaneId(initialProfile.lane_id);
      setCameraType(initialProfile.camera_type);
      setNotes(initialProfile.notes || "");
      setIsActive(initialProfile.is_active);
    } else {
      setLaneId(1);
      setCameraType("tvision");
      setNotes("");
      setIsActive(true);
    }
  }, [initialProfile, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialProfile?.id,
      lane_id: laneId,
      camera_type: cameraType,
      notes: notes.trim() || null,
      is_active: isActive,
      polygon_roi: initialProfile?.polygon_roi || [],
      pin_positions: initialProfile?.pin_positions || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {initialProfile ? "Редактирование профиля" : "Новый профиль калибровки"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Задайте дорожку, тип используемой оптики и рабочие примечания
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Выбор номера дорожки */}
            <div className="space-y-1.5">
              <Label htmlFor="lane_id" className="text-xs text-zinc-300 font-semibold">
                Номер дорожки (1..48)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="lane_id"
                  type="number"
                  min={1}
                  max={48}
                  value={laneId}
                  onChange={(e) => setLaneId(Number(e.target.value) || 1)}
                  className="w-32 bg-zinc-900 border-zinc-700 font-mono text-sm"
                  required
                />
                <span className="text-xs text-zinc-500 font-mono">
                  Спаренная пара дорожек: #{Math.ceil(laneId / 2)}
                </span>
              </div>
            </div>

            {/* Выбор типа камеры */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300 font-semibold">
                Модель и положение камеры
              </Label>
              <CameraTypeSelect value={cameraType} onChange={setCameraType} />
            </div>

            {/* Заметки оператора */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs text-zinc-300 font-semibold">
                Примечание / условия освещения
              </Label>
              <Input
                id="notes"
                placeholder="например: Камера после юстировки, лампы UV включены"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-sm"
              />
            </div>

            {/* Тумблер активности */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="space-y-0.5">
                <Label htmlFor="active-toggle" className="text-xs text-zinc-200 font-medium">
                  Сделать активным профилем дорожки
                </Label>
                <div className="text-[11px] text-zinc-400">
                  Автоматически снимет активность с предыдущего профиля этой дорожки
                </div>
              </div>
              <Switch
                id="active-toggle"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isLoading ? "Сохранение..." : "Сохранить профиль"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
