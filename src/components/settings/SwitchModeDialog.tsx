/**
 * @file src/components/settings/SwitchModeDialog.tsx
 * @description Диалог подтверждения переключения режима эмуляции / боевого режима с текстовым подтверждением.
 */

import React, { useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useSwitchOperationMode, type OperationMode } from "../../api/settings";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

interface SwitchModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetMode: OperationMode;
}

export function SwitchModeDialog({
  open,
  onOpenChange,
  targetMode,
}: SwitchModeDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const switchMutation = useSwitchOperationMode();

  const isCombat = targetMode === "combat";
  const expectedText = targetMode.toUpperCase();
  const isValid = confirmText.trim().toUpperCase() === expectedText;

  const handleConfirm = async () => {
    if (!isValid) return;
    try {
      await switchMutation.mutateAsync({
        mode: targetMode,
        confirm_token: confirmText.trim().toUpperCase(),
      });
      setConfirmText("");
      onOpenChange(false);
    } catch {
      // handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setConfirmText(""); onOpenChange(val); }}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <ShieldAlert className={`h-5 w-5 ${isCombat ? "text-amber-500" : "text-emerald-500"}`} />
            Переключение в {isCombat ? "Боевой режим (LIVE)" : "Режим Эмуляции (EMU)"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {isCombat
              ? "Все команды управления и опроса теперь будут идти на реальное оборудование по шине LCom. Убедитесь, что физический интерфейс подключен и исправен."
              : "Реальное оборудование будет отключено. Все процессы перейдут на виртуальный симулятор в памяти."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300">
              Для подтверждения действия введите токен <span className="font-mono font-bold text-white">{expectedText}</span> в поле ниже:
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Подтверждение</Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Введите ${expectedText}`}
              className="bg-zinc-900 border-zinc-800 text-xs font-mono text-white uppercase"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
          >
            Отмена
          </Button>
          <Button
            variant={isCombat ? "destructive" : "default"}
            size="sm"
            disabled={!isValid || switchMutation.isPending}
            onClick={handleConfirm}
            className="text-xs"
          >
            {switchMutation.isPending ? "Переключение..." : "Подтвердить переключение"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
