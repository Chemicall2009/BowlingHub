/**
 * @file src/components/dashboard/SystemHealth.tsx
 * @description Виджет состояния системы (латентность, потери кадров) с графиками.
 */

import React, { useMemo } from "react";
import { Zap, AlertTriangle, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useSnifferStream } from "../../ws/useSnifferStream";

export function SystemHealth() {
  const { status, frames } = useSnifferStream();

  const data = useMemo(() => {
    // Generate simple sparkline data based on recent frames
    return frames.slice(0, 20).reverse().map((f, i) => ({
      name: i,
      value: f.parsed ? 1 : 0.5, // Dummy latency/quality indicator
    }));
  }, [frames]);

  const latency = 15; // Placeholder
  const dropRate = status?.total_frames ? (status.dropped_frames / status.total_frames) * 100 : 0;

  return (
    <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Здоровье шины
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black font-mono text-zinc-100">{latency}ms</span>
          <span className={`text-xs ${dropRate > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {dropRate.toFixed(1)}% потерь
          </span>
        </div>
      </div>
      <div className="h-12 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey="value" stroke="#34d399" fill="#064e3b" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
