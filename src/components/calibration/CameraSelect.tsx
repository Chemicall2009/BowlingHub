/**
 * @file src/components/calibration/CameraSelect.tsx
 * @description Выбор конкретной камеры из списка доступных.
 */

import React from "react";
import { useCameras, type Camera } from "../../api/cameras";
import { Loader2, Camera as CameraIcon, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";

export interface CameraSelectProps {
  value?: string;
  onChange: (cameraId: string) => void;
  className?: string;
}

export function CameraSelect({ value, onChange, className = "" }: CameraSelectProps) {
  const { data: cameras, isLoading, error } = useCameras();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500 p-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Загрузка камер...
      </div>
    );
  }

  if (error || !cameras) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-500 p-2 border border-amber-900/50 rounded-lg bg-amber-950/20">
        <AlertTriangle className="w-4 h-4" />
        Ошибка загрузки камер
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-semibold text-zinc-200">
        Выберите физическую камеру
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-zinc-950 border-zinc-700">
          <SelectValue placeholder="Выберите камеру..." />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          {cameras.map((camera) => (
            <SelectItem key={camera.id} value={camera.id} className="text-zinc-100 hover:bg-zinc-800">
              <div className="flex items-center gap-2">
                <CameraIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{camera.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({camera.ip_address})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
