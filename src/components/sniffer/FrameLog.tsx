/**
 * @file src/components/sniffer/FrameLog.tsx
 * @description Виртуализированный лог кадров с автоскроллом и индикатором новых сообщений.
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import { Radio, ArrowDown } from "lucide-react";
import { EmptyState } from "../common/EmptyState";
import { FrameRow } from "./FrameRow";
import type { SnifferFrame } from "../../api/sniffer";
import { Button } from "../ui/button";

interface FrameLogProps {
  frames: SnifferFrame[];
  selectedFrameId: string | null;
  onSelectFrame: (id: string) => void;
  autoScroll: boolean;
  onAutoScrollChange: (autoScroll: boolean) => void;
}

export function FrameLog({
  frames,
  selectedFrameId,
  onSelectFrame,
  autoScroll,
  onAutoScrollChange,
}: FrameLogProps) {
  const listRef = useRef<FixedSizeList | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [newFramesCount, setNewFramesCount] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);
  const prevFramesLength = useRef(frames.length);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight || 500);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    if (frames.length > prevFramesLength.current) {
      const diff = frames.length - prevFramesLength.current;
      if (autoScroll) {
        listRef.current?.scrollToItem(0, "smart");
      } else {
        setNewFramesCount((prev) => prev + diff);
      }
    }
    prevFramesLength.current = frames.length;
  }, [frames.length, autoScroll]);

  const handleScroll = useCallback(
    ({
      scrollOffset,
      scrollDirection,
    }: {
      scrollOffset: number;
      scrollDirection: "forward" | "backward";
    }) => {
      if (scrollDirection === "backward" || scrollOffset > 50) {
        if (autoScroll) onAutoScrollChange(false);
      } else if (scrollOffset < 20) {
        if (!autoScroll) {
          onAutoScrollChange(true);
          setNewFramesCount(0);
        }
      }
    },
    [autoScroll, onAutoScrollChange]
  );

  const scrollToNewest = () => {
    listRef.current?.scrollToItem(0, "smart");
    onAutoScrollChange(true);
    setNewFramesCount(0);
  };

  if (frames.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-lg p-8">
        <EmptyState
          icon={Radio}
          title="Ожидание кадров..."
          description="Трафик LCom не обнаружен или сниффер находится в режиме паузы/остановки."
        />
      </div>
    );
  }

  const renderRow = ({ index, style }: ListChildComponentProps) => {
    const frame = frames[index];
    return (
      <FrameRow
        frame={frame}
        isSelected={selectedFrameId === frame.id}
        onClick={() => onSelectFrame(frame.id)}
        style={style}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400 font-mono">
        <div className="flex items-center gap-4">
          <span>ВРЕМЯ (ISO)</span>
          <span>НАПР</span>
          <span>ПОРТ</span>
          <span>КОМАНДА</span>
          <span>ДАННЫЕ (HEX)</span>
        </div>
        <span>ВСЕГО: {frames.length}</span>
      </div>

      <div className="flex-1 relative">
        <FixedSizeList
          ref={listRef}
          height={Math.max(containerHeight - 32, 100)}
          itemCount={frames.length}
          itemSize={36}
          width="100%"
          onScroll={handleScroll}
        >
          {renderRow}
        </FixedSizeList>

        {!autoScroll && newFramesCount > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg gap-2 text-xs rounded-full px-4"
              onClick={scrollToNewest}
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              ↓ Новые кадры ({newFramesCount})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
