/**
 * @file src/components/emulator/FramePreview.tsx
 * @description Компонент предпросмотра сырого кадра (Hex-view) с подсветкой и копированием.
 */

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "../ui/button";

interface FramePreviewProps {
  rawHex: string;
  className?: string;
}

export function FramePreview({ rawHex, className = "" }: FramePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-200 border border-zinc-800 ${className}`}>
      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-zinc-800 text-[10px] text-zinc-400">
        <span>HEX STREAM ({rawHex.split(" ").length} bytes)</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={handleCopy}
          title="Копировать hex"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <div className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-zinc-700 pb-1">
        <span className="tracking-widest text-emerald-400">{rawHex}</span>
      </div>
    </div>
  );
}
