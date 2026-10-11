/**
 * @file src/components/common/ModeSwitcher.tsx
 * @description Переключатель между боевым режимом (Hardware TCP/Serial) и эмуляцией (Mock).
 */

import React from "react";
import { Cpu, FlaskConical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "../../api/settings";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export function ModeSwitcher() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const mutation = useMutation({
    mutationFn: (newTransport: "mock" | "tcp") => updateSettings({ transport: newTransport }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      const isMock = updated.transport === "mock";
      toast.success(isMock ? "Включен режим эмуляции (Mock)" : "Включен боевой режим оборудования");
    },
    onError: () => {
      toast.error("Не удалось изменить режим работы");
    },
  });

  const isMock = settings?.transport === "mock";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutation.mutate(isMock ? "tcp" : "mock")}
            disabled={mutation.isPending}
            className={`h-8 gap-2 text-xs font-medium border ${
              isMock
                ? "bg-amber-950/40 border-amber-800/80 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200"
                : "bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/50 hover:text-emerald-200"
            }`}
          >
            {isMock ? (
              <>
                <FlaskConical className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>Эмуляция</span>
              </>
            ) : (
              <>
                <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                <span>Боевой режим</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Нажмите, чтобы переключить между Эмуляцией (Mock) и Боевым режимом ({settings?.transport?.toUpperCase() || "TCP"})
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
