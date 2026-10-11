/**
 * @file src/pages/Sniffer.tsx
 * @description Главный экран "Сниффер LCom-шины" с живым потоком через единый eventBus.
 */

import React, { useMemo, useState } from "react";
import { useSnifferEvents } from "../ws/hooks";
import { useSnifferStore } from "../stores/sniffer";
import { applyFilter } from "../api/sniffer";
import { SnifferControls } from "../components/sniffer/SnifferControls";
import { SnifferStatusBar } from "../components/sniffer/SnifferStatusBar";
import { FrameFilters } from "../components/sniffer/FrameFilters";
import { FrameLog } from "../components/sniffer/FrameLog";
import { SnifferStats } from "../components/sniffer/SnifferStats";
import { FrameInspector } from "../components/sniffer/FrameInspector";
import { ExportMenu } from "../components/sniffer/ExportMenu";
import { ErrorBanner } from "../components/sniffer/ErrorBanner";
import { Radio } from "lucide-react";
import { useWebSocket } from "../providers/WebSocketProvider";

export function Sniffer() {
  const { frames } = useSnifferEvents();
  const { status: wsStatus } = useWebSocket();
  const { filter, setFilter, resetFilter, autoScroll, setAutoScroll, selectedFrameId, setSelectedFrameId } =
    useSnifferStore();

  const [paused, setPaused] = useState(false);
  const [localFrames, setLocalFrames] = useState<any[]>([]);
  const [baud, setBaud] = useState<number>(9600);

  // Буферизация при паузе
  useMemo(() => {
    if (!paused) {
      setLocalFrames(frames);
    }
  }, [frames, paused]);

  const activeFrames = paused ? localFrames : frames;

  const filteredFrames = useMemo(() => {
    return applyFilter(activeFrames, filter);
  }, [activeFrames, filter]);

  const selectedFrame = useMemo(() => {
    if (!selectedFrameId) return null;
    return activeFrames.find((f) => f.id === selectedFrameId) || null;
  }, [activeFrames, selectedFrameId]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 p-4 overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Сниффер LCom-шины</h1>
            <p className="text-xs text-zinc-400">Мониторинг RS-485 / TCP трафика через единую шину событий</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExportMenu filteredFrames={filteredFrames} allFrames={activeFrames} />
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0">
        <SnifferControls
          isRunning={wsStatus === "open"}
          paused={paused}
          onTogglePause={setPaused}
          onClear={() => setLocalFrames([])}
          baud={baud}
          onBaudChange={setBaud}
        />
        <SnifferStatusBar
          status={{
            transport: "mock",
            endpoint: "ws://localhost:8000/ws",
            baud,
            status: wsStatus === "open" ? "online" : "offline",
            dropped_frames: 0,
            total_frames: activeFrames.length,
            connected_at: new Date().toISOString(),
          }}
          connected={wsStatus === "open"}
        />
      </div>

      <div className="flex-shrink-0">
        <FrameFilters filter={filter} onChange={setFilter} onReset={resetFilter} />
      </div>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <FrameLog
            frames={filteredFrames}
            selectedFrameId={selectedFrameId}
            onSelectFrame={setSelectedFrameId}
            autoScroll={autoScroll}
            onAutoScrollChange={setAutoScroll}
          />
        </div>

        <div className="w-[420px] hidden xl:flex flex-col gap-4 overflow-y-auto flex-shrink-0">
          {selectedFrame ? (
            <FrameInspector frame={selectedFrame} onClose={() => setSelectedFrameId(null)} />
          ) : (
            <SnifferStats frames={filteredFrames} />
          )}
        </div>
      </div>

      {selectedFrame && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end xl:hidden">
          <FrameInspector frame={selectedFrame} onClose={() => setSelectedFrameId(null)} />
        </div>
      )}
    </div>
  );
}
