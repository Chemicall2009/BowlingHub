/**
 * @file src/components/lane/PinTriangle.tsx
 * @description SVG-схема 10 кеглей боулинга со стандартным треугольным позиционированием.
 */

import React from "react";
import { cn } from "../../lib/utils";

interface PinPosition {
  pinNumber: number; // 1..10
  index: number; // 0..9 (индекс в массиве pins)
  cx: number;
  cy: number;
}

/**
 * Координаты 10 кеглей в сетке 100x100 viewbox:
 * Ряд 4 (сзади): 7, 8, 9, 10 (y = 20)
 * Ряд 3: 4, 5, 6 (y = 42)
 * Ряд 2: 2, 3 (y = 64)
 * Ряд 1 (впереди): 1 (y = 86)
 */
export const PIN_POSITIONS: PinPosition[] = [
  // Кегля 1 (головная)
  { pinNumber: 1, index: 0, cx: 50, cy: 86 },
  // Ряд 2
  { pinNumber: 2, index: 1, cx: 38, cy: 64 },
  { pinNumber: 3, index: 2, cx: 62, cy: 64 },
  // Ряд 3
  { pinNumber: 4, index: 3, cx: 26, cy: 42 },
  { pinNumber: 5, index: 4, cx: 50, cy: 42 },
  { pinNumber: 6, index: 5, cx: 74, cy: 42 },
  // Ряд 4
  { pinNumber: 7, index: 6, cx: 14, cy: 20 },
  { pinNumber: 8, index: 7, cx: 38, cy: 20 },
  { pinNumber: 9, index: 8, cx: 62, cy: 20 },
  { pinNumber: 10, index: 9, cx: 86, cy: 20 },
];

export interface PinTriangleProps {
  pins: boolean[];
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (pins: boolean[]) => void;
  onTogglePin?: (pinIndex: number) => void | Promise<void>;
  className?: string;
}

export function PinTriangle({
  pins,
  size = "md",
  interactive = false,
  onChange,
  onTogglePin,
  className,
}: PinTriangleProps) {
  const sizeClasses = {
    sm: "w-20 h-20 p-1.5",
    md: "w-32 h-32 p-2.5",
    lg: "w-56 h-56 p-4",
  }[size];

  const pinRadius = size === "sm" ? 7 : size === "md" ? 8.5 : 9.5;
  const fontSize = size === "sm" ? "7" : size === "md" ? "7.5" : "8";

  const handlePinClick = (index: number) => {
    if (!interactive) return;
    if (onTogglePin) {
      onTogglePin(index);
    }
    if (onChange) {
      const nextPins = [...pins];
      nextPins[index] = !nextPins[index];
      onChange(nextPins);
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-zinc-950/70 border border-zinc-800/80 shadow-inner",
        sizeClasses,
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Направляющие треугольника */}
        <path
          d="M 14 20 L 50 86 L 86 20 Z"
          fill="none"
          stroke="#27272a"
          strokeWidth="0.75"
          strokeDasharray="2,2"
        />

        {PIN_POSITIONS.map(({ pinNumber, index, cx, cy }) => {
          const isStanding = pins[index] ?? true;

          return (
            <g
              key={pinNumber}
              onClick={() => handlePinClick(index)}
              className={cn(
                interactive
                  ? "cursor-pointer transition-transform hover:scale-110"
                  : ""
              )}
            >
              {/* Контур сбитой кегли */}
              <circle
                cx={cx}
                cy={cy}
                r={pinRadius + 1}
                fill={isStanding ? "transparent" : "#18181b"}
                stroke={isStanding ? "transparent" : "#3f3f46"}
                strokeWidth="1"
                strokeDasharray={isStanding ? "none" : "2,2"}
              />

              {/* Тело кегли */}
              <circle
                cx={cx}
                cy={cy}
                r={pinRadius}
                fill={isStanding ? "#f4f4f5" : "#27272a"}
                stroke={isStanding ? "#10b981" : "#3f3f46"}
                strokeWidth={isStanding ? "1.5" : "1"}
                className="transition-colors duration-200"
              />

              {/* Номер кегли */}
              <text
                x={cx}
                y={cy + 2.8}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight="bold"
                fill={isStanding ? "#09090b" : "#71717a"}
                fontFamily="sans-serif"
                pointerEvents="none"
              >
                {pinNumber}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
