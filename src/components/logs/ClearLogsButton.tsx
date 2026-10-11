/**
 * @file src/components/logs/ClearLogsButton.tsx
 * @description Кнопка очистки текущего буфера логов с диалогом подтверждения.
 */

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { deleteLogs, type LogSource } from "../../api/logs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ClearLogsButtonProps {
  source: LogSource;
}

export function ClearLogsButton({ source }: ClearLogsButtonProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteLogs(source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      toast.success(`Буфер логов (${source}) успешно очищен`);
      setOpen(false);
    },
    onError: () => {
      toast.error("Не удалось очистить лог");
    },
  });

  const sourceName = source === "commands" ? "команд" : source === "traffic" ? "трафика" : "ошибок";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-red-950/50 hover:border-red-800 hover:text-red-300 text-xs"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" /> Очистить лог
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Очистить лог ${sourceName}?`}
        description="Все записанные в этот буфер события будут удалены без возможности восстановления."
        confirmLabel="Очистить"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
