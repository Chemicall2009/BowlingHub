/**
 * @file src/components/sniffer/SnifferStats.tsx
 * @description Метрики и графики анализа трафика LCom (recharts).
 */

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, AlertOctagon, CheckCircle2, Clock } from "lucide-react";
import { computeStats, type SnifferFrame } from "../../api/sniffer";

interface SnifferStatsProps {
  frames: SnifferFrame[];
}

export function SnifferStats({ frames }: SnifferStatsProps) {
  const stats = useMemo(() => computeStats(frames), [frames]);

  const laneChartData = useMemo(() => {
    return Object.entries(stats.by_lane)
      .map(([lane, count]) => ({
        lane: `Д-${lane}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [stats.by_lane]);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-lg flex flex-col gap-4">
      <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Activity className="h-4 w-4 text-blue-400" />
        Метрики трафика
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-md flex flex-col gap-1">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Activity className="h-3 w-3 text-blue-400" /> Всего кадров
          </span>
          <span className="text-lg font-bold font-mono text-white">{stats.total}</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-md flex flex-col gap-1">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Успешных (OK)
          </span>
          <span className="text-lg font-bold font-mono text-emerald-400">{stats.ok}</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-md flex flex-col gap-1">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <AlertOctagon className="h-3 w-3 text-red-400" /> Ошибок CRC
          </span>
          <span className="text-lg font-bold font-mono text-red-400">{stats.checksum_bad}</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-md flex flex-col gap-1">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-400" /> Ср. интервал
          </span>
          <span className="text-lg font-bold font-mono text-amber-400">{stats.avg_interval_ms} ms</span>
        </div>
      </div>

      {laneChartData.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-400">Активность по дорожкам (Топ)</span>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={laneChartData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                <XAxis dataKey="lane" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: "12px", borderRadius: "6px" }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {laneChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
