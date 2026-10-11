/**
 * @file src/components/calibration/CameraTypeSelect.tsx
 * @description Выбор типа камеры оптического подсчёта очков (T-Vision / VDB / Pin Deck).
 */

import React from "react";
import type { CalibrationCameraType } from "../../api/calibration";
import { Camera, Eye, Video } from "lucide-react";

export interface CameraTypeSelectProps {
  value: CalibrationCameraType;
  onChange: (val: CalibrationCameraType) => void;
  className?: string;
}

interface CameraOption {
  type: CalibrationCameraType;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: CameraOption[] = [
  {
    type: "tvision",
    title: "T-Vision",
    badge: "2.4м от пиндека",
    description: "Боковая камера между спаренными дорожками под углом 35°",
    icon: Camera,
  },
  {
    type: "pin_deck",
    title: "Pin Deck Cam",
    badge: "Над кеглями",
    description: "Штатная камера строго над зоной установки кеглей (вид сверху-спереди)",
    icon: Eye,
  },
  {
    type: "vdb",
    title: "VDB Sensor",
    badge: "Консольный монтаж",
    description: "Двухобъективный модуль Mendes Bowland над монитором пары",
    icon: Video,
  },
];

export function CameraTypeSelect({
  value,
  onChange,
  className = "",
}: CameraTypeSelectProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.type;

        return (
          <div
            key={opt.type}
            onClick={() => onChange(opt.type)}
            className={`relative flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
              isSelected
                ? "border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/30"
                : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/60"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                  }`}
                >
                  {opt.badge}
                </span>
              </div>
              <h4 className="font-semibold text-sm text-zinc-100">{opt.title}</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {opt.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className={isSelected ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                {isSelected ? "Выбрано" : "Выбрать"}
              </span>
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isSelected ? "bg-emerald-400 animate-pulse" : "bg-zinc-700"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
