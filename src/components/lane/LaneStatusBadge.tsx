/**
 * @file src/components/lane/LaneStatusBadge.tsx
 * @description Бейдж статуса подключения дорожки с цветовой индикацией из format.ts.
 */

import { Badge } from "../ui/badge";
import { statusColor } from "../../lib/format";
import { cn } from "../../lib/utils";

interface LaneStatusBadgeProps {
  status: "online" | "offline" | "degraded";
  className?: string;
}

export function LaneStatusBadge({ status, className }: LaneStatusBadgeProps) {
  const labelMap = {
    online: "Онлайн",
    offline: "Оффлайн",
    degraded: "Деградация",
  };

  const dotColor = {
    online: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
    offline: "bg-red-400 shadow-[0_0_8px_#f87171]",
    degraded: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
  }[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2 py-0.5 text-xs font-medium border-zinc-800 bg-zinc-950/70",
        statusColor(status),
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full inline-block animate-pulse", dotColor)} />
      {labelMap[status]}
    </Badge>
  );
}
