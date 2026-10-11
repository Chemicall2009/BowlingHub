/**
 * @file src/components/sniffer/FrameRow.tsx
 * @description Компактная строка кадра для виртуализированного лога (memoized).
 */

import React, { memo } from "react";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertTriangle } from "lucide-react";
import type { SnifferFrame } from "../../api/sniffer";
import { formatTimestamp } from "../../lib/format";

interface FrameRowProps {
  frame: SnifferFrame;
  isSelected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const FrameRow = memo(function FrameRow({ frame, isSelected, onClick, style }: FrameRowProps) {
  const isRx = frame.direction === "rx";
  const hasError = Boolean(frame.parse_error || (frame.parsed && !frame.parsed.checksumOk));
  const laneStr = frame.parsed ? `#${frame.parsed.laneId}` : "—";
  const cmdName = frame.parsed ? frame.parsed.cmdName : "UNKNOWN";

  const hexPreview = frame.raw_hex.length > 50 ? `${frame.raw_hex.substring(0, 48)}...` : frame.raw_hex;

  let badgeColor = "bg-zinc-800 text-zinc-300 border-zinc-700";
  if (cmdName === "STATUS_OK") badgeColor = "bg-emerald-950/80 text-emerald-400 border-emerald-800/60";
  else if (cmdName === "POLL_STATUS") badgeColor = "bg-blue-950/80 text-blue-400 border-blue-800/60";
  else if (cmdName === "RESET_LANE") badgeColor = "bg-amber-950/80 text-amber-400 border-amber-800/60";
  else if (hasError) badgeColor = "bg-red-950/80 text-red-400 border-red-800/60";

  return (
    <div
      style={style}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-1.5 text-xs font-mono border-b border-zinc-800/60 cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-950/40 border-l-2 border-l-blue-500"
          : hasError
          ? "bg-red-950/20 hover:bg-red-950/30"
          : "bg-zinc-900/40 hover:bg-zinc-800/50"
      }`}
    >
      <div className="flex items-center justify-center w-5 flex-shrink-0" title={isRx ? "RX (Вход)" : "TX (Выход)"}>
        {isRx ? (
          <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-blue-400" />
        )}
      </div>

      <div className="w-24 text-zinc-400 flex-shrink-0">
        {formatTimestamp(frame.timestamp)}
      </div>

      <div className="w-12 text-center text-zinc-300 font-semibold flex-shrink-0">
        {laneStr}
      </div>

      <div className="w-28 flex-shrink-0">
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold border ${badgeColor}`}>
          {cmdName}
        </span>
      </div>

      <div className="flex-1 text-zinc-300 truncate tracking-wide">
        {hexPreview}
      </div>

      <div className="w-8 flex justify-end flex-shrink-0" title={hasError ? (frame.parse_error || "Ошибка CRC") : "CRC OK"}>
        {hasError ? (
          <AlertTriangle className="h-4 w-4 text-red-400" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.frame.id === nextProps.frame.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.frame.raw_hex === nextProps.frame.raw_hex &&
    prevProps.frame.parse_error === nextProps.frame.parse_error
  );
});
