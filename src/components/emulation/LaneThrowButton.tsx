/**
 * @file src/components/emulation/LaneThrowButton.tsx
 * @description Кнопка ручной генерации броска на конкретной дорожке для режима эмуляции.
 */

import React from "react";
import { PlayCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useOperationMode } from "../../stores/operationMode";
import { useThrowNow } from "../../api/emulation";

interface LaneThrowButtonProps {
  laneId: number;
  size?: "sm" | "iconSm" | "default";
  variant?: "ghost" | "outline" | "secondary" | "default";
  showText?: boolean;
}

export const LaneThrowButton: React.FC<LaneThrowButtonProps> = ({
  laneId,
  size = "iconSm",
  variant = "outline",
  showText = false,
}) => {
  const mode = useOperationMode((s) => s.mode);
  const throwMutation = useThrowNow();

  if (mode !== "emulation") return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    throwMutation.mutate(laneId);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={size}
            variant={variant}
            onClick={handleClick}
            disabled={throwMutation.isPending}
            className="hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-300"
            aria-label="Симулировать бросок"
          >
            {throwMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            {showText && <span className="ml-1.5 text-xs">Бросок</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          Симулировать бросок шара на дорожке #{laneId}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
