/**
 * @file src/components/lane/LaneOptionsPanel.tsx
 * @description Панель 5 тумблеров опций дорожки с оптимистичным обновлением.
 */

import { Switch } from "../ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useUpdateLaneOptions } from "../../api/lanes";
import type { LaneOptions } from "../../lib/lcom";
import { cn } from "../../lib/utils";

export interface LaneOptionsPanelProps {
  laneId: number;
  options: LaneOptions;
  onOptionsChange?: (newOpts: Partial<LaneOptions>) => void;
}

interface OptionItem {
  key: keyof LaneOptions;
  title: string;
  description: string;
}

const OPTIONS_LIST: OptionItem[] = [
  {
    key: "bambini",
    title: "Детские бортики",
    description: "Автоподъём бамперов для детей",
  },
  {
    key: "cosmic",
    title: "Cosmic-подсветка",
    description: "Неоновый УФ-свет над дорожкой",
  },
  {
    key: "kbd_lock",
    title: "Блокировка пульта игроков",
    description: "Запрет ввода с консоли дорожки",
  },
  {
    key: "no_speed",
    title: "Отключить радар скорости",
    description: "Без замера скорости шара",
  },
  {
    key: "swap_off",
    title: "Запретить смену дорожек",
    description: "Без перехода между парой",
  },
];

export function LaneOptionsPanel({ laneId, options, onOptionsChange }: LaneOptionsPanelProps) {
  const updateMutation = useUpdateLaneOptions();

  const handleToggle = (key: keyof LaneOptions, checked: boolean) => {
    if (onOptionsChange) {
      onOptionsChange({ [key]: checked });
    }
    updateMutation.mutate({
      id: laneId,
      options: { [key]: checked },
    });
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
      <CardHeader className="p-4 pb-3 border-b border-zinc-800">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>Опции и режимы дорожки</span>
          <span className="text-xs font-mono text-zinc-500 font-normal">
            LCom Node #{laneId}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {OPTIONS_LIST.map(({ key, title, description }) => {
          const isChecked = Boolean(options[key]);
          const isPending = updateMutation.isPending;

          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                isChecked
                  ? "bg-zinc-800/60 border-zinc-700/70"
                  : "bg-zinc-950/40 border-zinc-800/60"
              )}
            >
              <div className="flex-1 pr-3">
                <div className="text-sm font-medium text-zinc-200">
                  {title}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {description}
                </div>
              </div>

              <div className={cn("shrink-0", isPending && "opacity-60")}>
                <Switch
                  checked={isChecked}
                  disabled={isPending}
                  onCheckedChange={(val) => handleToggle(key, val)}
                  aria-label={title}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
