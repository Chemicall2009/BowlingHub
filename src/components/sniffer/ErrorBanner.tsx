/**
 * @file src/components/sniffer/ErrorBanner.tsx
 * @description Баннер для отображения последних критических ошибок шины и CRC из WebSocket-потока.
 */

import React, { useState } from "react";
import { AlertOctagon, X } from "lucide-react";
import type { SnifferError } from "../../api/sniffer";
import { formatTimestamp } from "../../lib/format";
import { Button } from "../ui/button";

interface ErrorBannerProps {
  errors: SnifferError[];
}

export function ErrorBanner({ errors }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || errors.length === 0) {
    return null;
  }

  const recentErrors = errors.slice(0, 3);

  return (
    <div className="bg-red-950/80 border border-red-800/80 rounded-lg p-3 flex flex-col gap-2 text-xs text-red-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-red-100">
          <AlertOctagon className="h-4 w-4 text-red-400 animate-pulse" />
          <span>Критические ошибки шины LCom ({errors.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-red-300 hover:text-white hover:bg-red-900/50"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3.5 w-3.5" /> Скрыть
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        {recentErrors.map((err, idx) => (
          <div key={idx} className="flex items-center justify-between bg-red-900/40 px-2 py-1 rounded font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-bold">[{err.code}]</span>
              <span>{err.message}</span>
              {err.lane_id && <span className="text-red-300 font-semibold">(Дорожка #{err.lane_id})</span>}
            </div>
            <span className="text-red-400">{formatTimestamp(err.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
