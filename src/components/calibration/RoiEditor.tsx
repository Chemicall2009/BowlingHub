/**
 * @file src/components/calibration/RoiEditor.tsx
 * @description Панель управления полигоном области интереса (ROI).
 */

import React, { useState } from "react";
import type { Point } from "../../api/calibration";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Maximize2, RotateCcw } from "lucide-react";

export interface RoiEditorProps {
  polygonRoi: Point[];
  onChange: (roi: Point[]) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

export function RoiEditor({
  polygonRoi,
  onChange,
  canvasWidth = 640,
  canvasHeight = 480,
}: RoiEditorProps) {
  const [isRectMode, setIsRectMode] = useState(false);

  const handlePointChange = (
    index: number,
    field: "x" | "y",
    value: string
  ) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;

    if (isRectMode && polygonRoi.length === 4) {
      // В режиме прямоугольника связываем углы:
      // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
      const next = [...polygonRoi];
      next[index] = { ...next[index], [field]: Math.round(num) };

      if (index === 0) {
        // top-left изменен
        if (field === "x") next[3].x = Math.round(num);
        if (field === "y") next[1].y = Math.round(num);
      } else if (index === 1) {
        // top-right изменен
        if (field === "x") next[2].x = Math.round(num);
        if (field === "y") next[0].y = Math.round(num);
      } else if (index === 2) {
        // bottom-right изменен
        if (field === "x") next[1].x = Math.round(num);
        if (field === "y") next[3].y = Math.round(num);
      } else if (index === 3) {
        // bottom-left изменен
        if (field === "x") next[0].x = Math.round(num);
        if (field === "y") next[2].y = Math.round(num);
      }
      onChange(next);
      return;
    }

    const nextRoi = [...polygonRoi];
    nextRoi[index] = {
      ...nextRoi[index],
      [field]: Math.round(num),
    };
    onChange(nextRoi);
  };

  const handleResetDefault = () => {
    onChange([
      { x: Math.round(canvasWidth * 0.28), y: Math.round(canvasHeight * 0.22) },
      { x: Math.round(canvasWidth * 0.72), y: Math.round(canvasHeight * 0.22) },
      { x: Math.round(canvasWidth * 0.78), y: Math.round(canvasHeight * 0.65) },
      { x: Math.round(canvasWidth * 0.22), y: Math.round(canvasHeight * 0.65) },
    ]);
  };

  const handleFitCanvas = () => {
    const padding = 20;
    onChange([
      { x: padding, y: padding },
      { x: canvasWidth - padding, y: padding },
      { x: canvasWidth - padding, y: canvasHeight - padding },
      { x: padding, y: canvasHeight - padding },
    ]);
  };

  const pointLabels = [
    "Верх-лево (R1)",
    "Верх-право (R2)",
    "Низ-право (R3)",
    "Низ-лево (R4)",
  ];

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-zinc-800">
        <div>
          <CardTitle className="text-sm font-semibold">
            Область интереса (ROI Пиндека)
          </CardTitle>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Зона анализа видеопотока 4 точками
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefault}
            className="h-8 gap-1 text-xs border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            Сброс
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFitCanvas}
            className="h-8 gap-1 text-xs border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200"
          >
            <Maximize2 className="w-3 h-3 text-sky-400" />
            Весь кадр
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Переключатель режима связывания */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60">
          <div className="space-y-0.5">
            <Label htmlFor="rect-mode" className="text-xs text-zinc-200">
              Режим: {isRectMode ? "Связанный прямоугольник" : "Произвольный полигон (Трапеция)"}
            </Label>
            <div className="text-[10px] text-zinc-400">
              {isRectMode
                ? "Углы двигаются сопряженно"
                : "Каждый угол настраивается отдельно по перспективе дорожки"}
            </div>
          </div>
          <Switch
            id="rect-mode"
            checked={isRectMode}
            onCheckedChange={setIsRectMode}
          />
        </div>

        {/* Сетка координат 4 точек */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
          {polygonRoi.map((pt, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-sans">
                <span className="font-medium text-emerald-400">
                  {pointLabels[idx]}
                </span>
                <span className="font-mono text-[10px] text-zinc-500">#{idx + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-zinc-500 text-[11px]">X:</span>
                  <Input
                    type="number"
                    value={Math.round(pt.x)}
                    onChange={(e) =>
                      handlePointChange(idx, "x", e.target.value)
                    }
                    className="h-7 px-1.5 py-0 font-mono text-xs bg-zinc-900 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-zinc-500 text-[11px]">Y:</span>
                  <Input
                    type="number"
                    value={Math.round(pt.y)}
                    onChange={(e) =>
                      handlePointChange(idx, "y", e.target.value)
                    }
                    className="h-7 px-1.5 py-0 font-mono text-xs bg-zinc-900 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
