/**
 * @file src/components/calibration/CalibrationCanvas.tsx
 * @description Интерактивный Canvas редактор разметки кеглей и ROI с pointer events.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { Point } from "../../api/calibration";

export interface CalibrationCanvasProps {
  imageUrl: string;
  width?: number;
  height?: number;
  pinPositions: Point[];
  polygonRoi: Point[];
  onPinPositionsChange: (pins: Point[]) => void;
  onPolygonRoiChange: (roi: Point[]) => void;
  mode?: "pins" | "roi" | "view";
  showGrid?: boolean;
  zoom?: number;
  backgroundOpacity?: number;
  highlightedPinIndex?: number | null;
  onPinSelect?: (index: number | null) => void;
  onZoomChange?: (zoom: number) => void;
}

type DragTarget =
  | { type: "pin"; index: number }
  | { type: "roi"; index: number }
  | { type: "pan"; startX: number; startY: number }
  | null;

export function CalibrationCanvas({
  imageUrl,
  width = 640,
  height = 480,
  pinPositions,
  polygonRoi,
  onPinPositionsChange,
  onPolygonRoiChange,
  mode = "pins",
  showGrid = true,
  zoom = 1,
  backgroundOpacity = 1,
  highlightedPinIndex = null,
  onPinSelect,
  onZoomChange,
}: CalibrationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pan смещение (в логических координатах canvas)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Активный drag
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [activePointCoord, setActivePointCoord] = useState<Point | null>(null);

  // Загрузка фонового изображения
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };

    img.onerror = () => {
      // Фолбэк на дефолтную отрисовку
      imageRef.current = null;
      setImageLoaded(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  // Преобразование экранных координат (клиентские события) в координаты изображения
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      // Масштаб отображения CSS к логическим размерам width/height
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;

      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY;

      // Обратное преобразование pan и zoom
      const imgX = (canvasX - pan.x) / zoom;
      const imgY = (canvasY - pan.y) / zoom;

      return {
        x: Math.round(imgX),
        y: Math.round(imgY),
      };
    },
    [width, height, pan.x, pan.y, zoom]
  );

  // Отрисовка кадра
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Применяем Pan и Zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Отрисовка фонового изображения
    if (imageRef.current && imageLoaded) {
      ctx.globalAlpha = backgroundOpacity;
      ctx.drawImage(imageRef.current, 0, 0, width, height);
      ctx.globalAlpha = 1.0;
    } else {
      // Тёмный фон при отсутствии картинки
      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Сетка калибровки (Grid)
    if (showGrid) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1 / zoom;
      const step = 40;
      for (let x = 0; x <= width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Центральные осевые линии
      ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
      ctx.lineWidth = 1.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    // 3. Отрисовка ROI (4 точки)
    if (polygonRoi.length === 4) {
      ctx.beginPath();
      ctx.moveTo(polygonRoi[0].x, polygonRoi[0].y);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(polygonRoi[i].x, polygonRoi[i].y);
      }
      ctx.closePath();

      // Заливка
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fill();

      // Контур
      ctx.strokeStyle = mode === "roi" ? "#10b981" : "rgba(16, 185, 129, 0.6)";
      ctx.lineWidth = (mode === "roi" ? 2.5 : 1.5) / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Точки ROI (квадраты 8x8)
      polygonRoi.forEach((pt, idx) => {
        const isDragging = dragTarget?.type === "roi" && dragTarget.index === idx;
        const size = (isDragging ? 12 : 8) / zoom;

        ctx.fillStyle = isDragging ? "#34d399" : "#10b981";
        ctx.fillRect(pt.x - size / 2, pt.y - size / 2, size, size);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5 / zoom;
        ctx.strokeRect(pt.x - size / 2, pt.y - size / 2, size, size);

        // Метка точки ROI (R1..R4)
        ctx.fillStyle = "#ffffff";
        ctx.font = `${Math.max(9, Math.round(10 / zoom))}px monospace`;
        ctx.fillText(`R${idx + 1}`, pt.x + size, pt.y - size);
      });
    }

    // 4. Отрисовка точек кеглей (10 кружков)
    pinPositions.forEach((pt, idx) => {
      const pinNum = idx + 1;
      const isDragging = dragTarget?.type === "pin" && dragTarget.index === idx;
      const isHighlighted = highlightedPinIndex === idx;
      const radius = (isDragging ? 12 : isHighlighted ? 11 : 9) / zoom;

      // Внешнее свечение / кольцо фокуса
      if (isDragging || isHighlighted) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius + 5 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();
      }

      // Основной круг
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDragging
        ? "#059669"
        : isHighlighted
        ? "#10b981"
        : mode === "pins"
        ? "#18181b"
        : "rgba(24, 24, 27, 0.85)";
      ctx.fill();

      ctx.strokeStyle = isDragging || isHighlighted ? "#34d399" : "#fbbf24";
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      // Номер кегли внутри
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.max(8, Math.round(10 / zoom))}px sans-serif`;
      ctx.fillText(String(pinNum), pt.x, pt.y);
    });

    ctx.restore();
  }, [
    width,
    height,
    pan.x,
    pan.y,
    zoom,
    imageLoaded,
    backgroundOpacity,
    showGrid,
    polygonRoi,
    mode,
    dragTarget,
    pinPositions,
    highlightedPinIndex,
  ]);

  // Запуск отрисовки через rAF
  useEffect(() => {
    let animId: number;
    const render = () => {
      renderCanvas();
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [renderCanvas]);

  // Поиск ближайшей точки при клике
  const findHitTarget = (coords: Point): DragTarget => {
    const hitRadius = 16 / zoom;

    // Сначала ищем среди кеглей (если режим pins или view)
    if (mode === "pins" || mode === "view") {
      for (let i = 0; i < pinPositions.length; i++) {
        const p = pinPositions[i];
        const dist = Math.hypot(p.x - coords.x, p.y - coords.y);
        if (dist <= hitRadius) {
          return { type: "pin", index: i };
        }
      }
    }

    // Ищем среди точек ROI
    if (mode === "roi" || mode === "view") {
      for (let i = 0; i < polygonRoi.length; i++) {
        const p = polygonRoi[i];
        const dist = Math.hypot(p.x - coords.x, p.y - coords.y);
        if (dist <= hitRadius) {
          return { type: "roi", index: i };
        }
      }
    }

    return null;
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    // Средняя кнопка мыши (button 1) или зажатый Alt/Space — Pan режим
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setDragTarget({ type: "pan", startX: e.clientX - pan.x, startY: e.clientY - pan.y });
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const target = findHitTarget(coords);

    if (target) {
      setDragTarget(target);
      if (target.type === "pin") {
        onPinSelect?.(target.index);
        setActivePointCoord(pinPositions[target.index]);
      } else if (target.type === "roi") {
        setActivePointCoord(polygonRoi[target.index]);
      }
    } else {
      onPinSelect?.(null);
      setActivePointCoord(null);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setCursorPos(coords);

    if (!dragTarget) return;

    if (dragTarget.type === "pan") {
      setPan({
        x: e.clientX - dragTarget.startX,
        y: e.clientY - dragTarget.startY,
      });
      return;
    }

    if (dragTarget.type === "pin") {
      // Ограничиваем в пределах кадра
      const clampedX = Math.max(0, Math.min(width, coords.x));
      const clampedY = Math.max(0, Math.min(height, coords.y));
      const nextPins = [...pinPositions];
      nextPins[dragTarget.index] = { x: clampedX, y: clampedY };
      onPinPositionsChange(nextPins);
      setActivePointCoord({ x: clampedX, y: clampedY });
    } else if (dragTarget.type === "roi") {
      const clampedX = Math.max(0, Math.min(width, coords.x));
      const clampedY = Math.max(0, Math.min(height, coords.y));
      const nextRoi = [...polygonRoi];
      nextRoi[dragTarget.index] = { x: clampedX, y: clampedY };
      onPolygonRoiChange(nextRoi);
      setActivePointCoord({ x: clampedX, y: clampedY });
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setDragTarget(null);
    setIsPanning(false);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Zoom колесом мыши
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const nextZoom = Math.min(3.0, Math.max(0.5, parseFloat((zoom + delta).toFixed(2))));
    onZoomChange?.(nextZoom);
  };

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-2xl">
      {/* Canvas container */}
      <div className="relative w-full aspect-[4/3] bg-zinc-950 flex items-center justify-center overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className={`w-full h-full object-contain ${
            isPanning
              ? "cursor-grab active:cursor-grabbing"
              : dragTarget
              ? "cursor-crosshair"
              : "cursor-default"
          }`}
          style={{ touchAction: "none" }}
        />

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
          <span className="font-mono text-[11px] bg-zinc-900/90 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded shadow">
            {width}x{height}
          </span>
          <span className="font-mono text-[11px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded shadow">
            Zoom: {(zoom * 100).toFixed(0)}%
          </span>
        </div>

        {/* Инструкция управления */}
        <div className="absolute top-2 right-2 hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-2 py-1 rounded">
          <span>Скролл: Зум</span> • <span>Колесико: Сдвиг</span>
        </div>
      </div>

      {/* Координатная полоса под canvas */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span>
            Курсор:{" "}
            <span className="text-zinc-200">
              {cursorPos ? `X: ${cursorPos.x}, Y: ${cursorPos.y}` : "--"}
            </span>
          </span>
          {activePointCoord && (
            <span className="text-emerald-400">
              Точка: X: {activePointCoord.x}, Y: {activePointCoord.y}
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-500">
          Режим: <span className="text-zinc-300 font-semibold uppercase">{mode}</span>
        </div>
      </div>
    </div>
  );
}
