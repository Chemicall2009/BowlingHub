/**
 * @file src/components/common/EmptyState.tsx
 * @description Компонент отображения пустого состояния с иконкой и действием.
 */

import React, { type ReactNode } from "react";
import { Layers, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon = Layers,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 mb-3.5 shadow-inner">
        <Icon className="h-7 w-7 text-zinc-400" />
      </div>
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      {description && (
        <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
