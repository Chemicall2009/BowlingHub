/**
 * @file src/components/calibration/PinPositionList.tsx
 * @description Редактор координат 10 кеглей боулинга с ручным вводом и стандартной автораскладкой.
 */

import React from "react";
import type { Point } from "../../api/calibration";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { RotateCcw, Sparkles } from "lucide-react";

export interface PinPositionListProps {
  pinPositions: Point[];
  onChange: (pins: Point[]) => void;
  selectedPinIndex: number | null;
  onSelectPin: (index: number | null) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * Расчёт стандартного треугольника 10 кеглей в процентах от ширины и высоты кадра:
 * Ряд 1: кегля 1 (головная) -> y = 0.20h, x = 0.50w
 * Ряд 2: кегли 2, 3 -> y = 0.40h, x = [0.416w, 0.583w]
 * Ряд 3: кегли 4, 5, 6 -> y = 0.60h, x = [0.333w, 0.50w, 0.666w]
 * Ряд 4: кегли 7, 8, 9, 10 -> y = 0.80h, x = [0.25w, 0.416w, 0.583w, 0.75w]
 */
export function getStandardPinLayout(width: number = 640, height: number = 480): Point[] {
  const yRow1 = Math.round(height * 0.28);
  const yRow2 = Math.round(height * 0.38);
  const yRow3 = Math.round(height * 0.48);
  const yRow4 = Math.round(height * 0.58);

  const xMin = width * 0.28;
  const xMax = width * 0.72;
  const xSpan = xMax - xMin;

  return [
    // 1
    { x: Math.round(width * 0.5), y: yRow1 },
    // 2, 3
    { x: Math.round(xMin + xSpan * (1 / 3)), y: yRow2 },
    { x: Math.round(xMin + xSpan * (2 / 3)), y: yRow2 },
    // 4, 5, 6
    { x: Math.round(xMin + xSpan * 0.17), y: yRow3 },
    { x: Math.round(width * 0.5), y: yRow3 },
    { x: Math.round(xMin + xSpan * 0.83), y: yRow3 },
    // 7, 8, 9, 10
    { x: Math.round(xMin), y: yRow4 },
    { x: Math.round(xMin + xSpan * (1 / 3)), y: yRow4 },
    { x: Math.round(xMin + xSpan * (2 / 3)), y: yRow4 },
    { x: Math.round(xMax), y: yRow4 },
  ];
}

export function PinPositionList({
  pinPositions,
  onChange,
  selectedPinIndex,
  onSelectPin,
  canvasWidth = 640,
  canvasHeight = 480,
}: PinPositionListProps) {
  const handleCoordinateChange = (
    index: number,
    field: "x" | "y",
    value: string
  ) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const nextPins = [...pinPositions];
    nextPins[index] = {
      ...nextPins[index],
      [field]: Math.round(num),
    };
    onChange(nextPins);
  };

  const handleResetToCenter = (index: number) => {
    const nextPins = [...pinPositions];
    nextPins[index] = {
      x: Math.round(canvasWidth / 2),
      y: Math.round(canvasHeight / 2),
    };
    onChange(nextPins);
    onSelectPin(index);
  };

  const handleApplyStandardLayout = () => {
    const standard = getStandardPinLayout(canvasWidth, canvasHeight);
    onChange(standard);
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-zinc-800">
        <div>
          <CardTitle className="text-sm font-semibold">
            Координаты кеглей (1..10)
          </CardTitle>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Кликните для подсветки на камере
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyStandardLayout}
          className="h-8 gap-1.5 text-xs border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Стандартная раскладка
        </Button>
      </CardHeader>

      <CardContent className="p-3 max-h-[360px] overflow-y-auto space-y-1.5 font-mono text-xs">
        {pinPositions.map((pt, idx) => {
          const pinNumber = idx + 1;
          const isSelected = selectedPinIndex === idx;

          return (
            <div
              key={pinNumber}
              onClick={() => onSelectPin(idx)}
              className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "border-emerald-500 bg-emerald-950/30 shadow-md ring-1 ring-emerald-500/50"
                  : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-800/40"
              }`}
            >
              {/* Номер кегли */}
              <div className="flex items-center gap-2 w-16 shrink-0">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isSelected
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-zinc-800 text-amber-400 border border-zinc-700"
                  }`}
                >
                  {pinNumber}
                </span>
                <span className="text-[11px] text-zinc-400">№{pinNumber}</span>
              </div>

              {/* Input X */}
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[11px]">X:</span>
                <Input
                  type="number"
                  value={Math.round(pt.x)}
                  onChange={(e) =>
                    handleCoordinateChange(idx, "x", e.target.value)
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-16 px-1.5 py-0 text-right font-mono text-xs bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Input Y */}
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-[11px]">Y:</span>
                <Input
                  type="number"
                  value={Math.round(pt.y)}
                  onChange={(e) =>
                    handleCoordinateChange(idx, "y", e.target.value)
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-16 px-1.5 py-0 text-right font-mono text-xs bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Кнопка сброса */}
              <Button
                variant="ghost"
                size="iconSm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetToCenter(idx);
                }}
                title="Сбросить в центр кадра"
                className="h-7 w-7 text-zinc-400 hover:text-white"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
