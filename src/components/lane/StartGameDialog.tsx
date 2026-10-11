/**
 * @file src/components/lane/StartGameDialog.tsx
 * @description Многошаговое модальное окно для создания новой игры (выбор дорожек, игроков, тарифа, времени).
 */

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGame } from "../../api/games";
import { toast } from "sonner";

interface StartGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laneId: number;
}

export const StartGameDialog: React.FC<StartGameDialogProps> = ({ open, onOpenChange, laneId }) => {
  const [step, setStep] = useState(1);
  const [selectedLanes, setSelectedLanes] = useState<number[]>([laneId]);
  const [players, setPlayers] = useState<string[]>(["Игрок 1"]);
  const [tariff, setTariff] = useState("standard");
  const [duration, setDuration] = useState(60);
  const [isPrepaid, setIsPrepaid] = useState(false);
  const queryClient = useQueryClient();

  const startGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      toast.success("Новая игра запущена");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["lanes"] });
      queryClient.invalidateQueries({ queryKey: ["lane", laneId] });
    },
    onError: () => toast.error("Ошибка создания игры"),
  });

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = () => {
    startGameMutation.mutate({
      lane_ids: selectedLanes,
      players: players.filter((p) => p.trim().length > 0),
      tariff,
      durationMinutes: duration,
      isPrepaid,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Новая игра (Шаг {step}/5)</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {step === 1 && (
            <div className="space-y-2">
              <Label>Выберите дорожки</Label>
              <div className="grid grid-cols-4 gap-2">
                 {[1,2,3,4,5,6,7,8,9,10,11,12].map(l => (
                     <Button 
                        key={l} 
                        variant={selectedLanes.includes(l) ? "default" : "outline"}
                        onClick={() => setSelectedLanes(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])}
                        className="text-xs"
                     >
                         #{l}
                     </Button>
                 ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
                <Label>Игроки</Label>
                {players.map((name, index) => (
                    <div key={index} className="flex gap-2">
                        <Input value={name} onChange={(e) => setPlayers(players.map((p, i) => i === index ? e.target.value : p))} placeholder={`Игрок ${index+1}`} />
                        <Button variant="ghost" size="icon" onClick={() => setPlayers(players.filter((_, i) => i !== index))}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => setPlayers([...players, `Игрок ${players.length + 1}`])}><Plus className="w-4 h-4 mr-2"/> Добавить</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
                <Label>Тариф</Label>
                <Select value={tariff} onValueChange={setTariff}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="standard">Стандартный</SelectItem>
                        <SelectItem value="weekend">Выходной</SelectItem>
                        <SelectItem value="night">Ночной</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
                <Label>Длительность: {duration} мин</Label>
                <Input type="range" min={30} max={240} step={30} value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
            </div>
          )}

          {step === 5 && (
            <div className="flex items-center space-x-2">
                <Switch id="prepaid" checked={isPrepaid} onCheckedChange={(c) => setIsPrepaid(c)} />
                <Label htmlFor="prepaid">Предоплата внесена</Label>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={step === 1}><ChevronLeft/></Button>
            {step < 5 ? (
                <Button onClick={handleNext}><ChevronRight/></Button>
            ) : (
                <Button onClick={handleSubmit} disabled={startGameMutation.isPending} className="bg-emerald-600">Готово</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
