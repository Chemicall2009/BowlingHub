import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  RotateCcw,
  Play,
  SkipForward,
  Layers,
  Sparkles,
  Terminal,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  MonitorPlay,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useOperationMode } from "../stores/operationMode";
import { useThrowNow } from "../api/emulation";
import { getLaneById, resetLane, updateLanePins, addShotToLane } from "../api/lanes";
import { getGame, createGame, newFrame } from "../api/games";
import { PinTriangle } from "../components/lane/PinTriangle";
import { LaneStatusBadge } from "../components/lane/LaneStatusBadge";
import { LaneOptionsPanel } from "../components/lane/LaneOptionsPanel";
import { ShotTimeline } from "../components/lane/ShotTimeline";
import { StartGameDialog } from "../components/lane/StartGameDialog";
import { ScoreBoard } from "../components/score/ScoreBoard";
import { LaneThrowButton } from "../components/emulation/LaneThrowButton";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import {
  buildFrame,
  parseFrame,
  formatFrameHex,
  type ParsedFrame,
  CMD_POLL_STATUS,
  CMD_STATUS_OK,
  CMD_RESET_LANE,
  CMD_MACHINE_CTRL,
  CMD_UPLOAD_DATA,
} from "../lib/lcom";
import type { Lane } from "../api/types";

export function LaneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const laneId = Number(id) || 1;

  const mode = useOperationMode((s) => s.mode);
  const throwNow = useThrowNow();

  const [copiedJson, setCopiedJson] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [startGameDialogOpen, setStartGameDialogOpen] = useState(false);
  const [operatorNotes, setOperatorNotes] = useState<string>(() => {
    return localStorage.getItem(`bowland_notes_lane_${laneId}`) || "";
  });

  // Query lane detail
  const {
    data: lane,
    isLoading: isLaneLoading,
    refetch: refetchLane,
  } = useQuery({
    queryKey: ["lane", laneId],
    queryFn: () => getLaneById(laneId),
    refetchInterval: 5000,
  });

  // Query game if active
  const { data: activeGame, refetch: refetchGame } = useQuery({
    queryKey: ["game", lane?.current_game?.id],
    queryFn: () => getGame(lane!.current_game!.id),
    enabled: !!lane?.current_game?.id,
  });

  // Reset lane mutation
  const resetMutation = useMutation({
    mutationFn: () => resetLane(laneId),
    onSuccess: () => {
      toast.success(`Пинсеттер дорожки ${laneId} успешно сброшен`);
      queryClient.invalidateQueries({ queryKey: ["lane", laneId] });
      queryClient.invalidateQueries({ queryKey: ["lanes"] });
      setResetDialogOpen(false);
    },
    onError: () => toast.error("Ошибка команды сброса"),
  });

  // New Frame mutation
  const newFrameMutation = useMutation({
    mutationFn: () => newFrame(laneId),
    onSuccess: () => {
      toast.success(`Дорожка ${laneId} переведена на новый фрейм`);
      refetchLane();
      refetchGame();
    },
    onError: () => toast.error("Ошибка переключения фрейма"),
  });

  // Toggle single pin interactive mode
  const handleTogglePin = async (pinIndex: number) => {
    if (!lane) return;
    const currentPins = [...lane.pins];
    currentPins[pinIndex] = !currentPins[pinIndex];

    try {
      await updateLanePins(laneId, currentPins);
      queryClient.setQueryData<Lane>(["lane", laneId], (old) => {
        if (!old) return old;
        return { ...old, pins: currentPins };
      });
    } catch {
      toast.error("Не удалось передать положение кегли");
    }
  };

  // Quick set pins presets
  const handleSetAllPins = async (standing: boolean) => {
    const newPins = new Array(10).fill(standing);
    try {
      await updateLanePins(laneId, newPins);
      queryClient.setQueryData<Lane>(["lane", laneId], (old) => {
        if (!old) return old;
        return { ...old, pins: newPins };
      });
      toast.success(standing ? "Все кегли подняты (10)" : "Все кегли сбиты (Strike)");
    } catch {
      toast.error("Ошибка отправки состояния кеглей");
    }
  };

  // Simulate throwing a ball with current pin state
  const handleSimulateShot = async () => {
    if (!lane) return;
    const currentStanding = lane.pins.filter(Boolean).length;
    const knocked = 10 - currentStanding;
    const isStrike = knocked === 10;
    const isFoul = Math.random() < 0.08;
    const isSplit = !isStrike && knocked > 6 && Math.random() < 0.25;
    const speed = parseFloat((22 + Math.random() * 8).toFixed(1));

    try {
      await addShotToLane(laneId, {
        frame: lane.current_game?.current_frame || 1,
        shot: 1,
        pins_down: knocked,
        pins_state: lane.pins,
        is_foul: isFoul,
        is_split: isSplit,
        ball_speed: speed,
      });
      toast.success(`Бросок зарегистрирован: ${knocked} сбито (${speed} км/ч)`);
      refetchLane();
    } catch {
      toast.error("Ошибка симуляции броска");
    }
  };

  // Save notes
  const handleSaveNotes = () => {
    localStorage.setItem(`bowland_notes_lane_${laneId}`, operatorNotes);
    toast.success("Заметки сохранены");
  };

  // Copy JSON Pin State
  const handleCopyJson = () => {
    if (!lane) return;
    navigator.clipboard.writeText(JSON.stringify(lane.pins, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  // Generate mock LCom telemetry traffic packets for inspect tab
  const mockPackets: ParsedFrame[] = React.useMemo(() => {
    const laneNum = lane?.number || 1;
    const xor = 0x00;
    const frames = [
      buildFrame(CMD_POLL_STATUS, laneNum, lane?.options || null, xor),
      buildFrame(CMD_STATUS_OK, laneNum, null, xor),
      buildFrame(CMD_RESET_LANE, laneNum, null, xor),
      buildFrame(CMD_MACHINE_CTRL, laneNum, null, xor),
      buildFrame(CMD_UPLOAD_DATA, laneNum, null, xor),
    ];
    return frames.map((f) => parseFrame(f, xor)).filter((p): p is ParsedFrame => p !== null);
  }, [lane?.number, lane?.options]);

  if (isLaneLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <span className="font-mono text-sm text-zinc-400">
            Подключение к контроллеру дорожки #{laneId}...
          </span>
        </div>
      </div>
    );
  }

  if (!lane) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-xl font-bold text-red-400">
          Дорожка #{laneId} не найдена в конфигурации
        </div>
        <Button onClick={() => navigate("/")} variant="outline">
          Вернуться на главную
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="iconSm"
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white"
            title="Назад к дорожкам"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black font-mono tracking-tight text-white">
                Дорожка #{lane.number}
              </h1>
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                <Layers className="w-3.5 h-3.5" /> Пара {Math.ceil(lane.number / 2)}
              </span>
              <LaneStatusBadge status={lane.status} />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Qubica AMF Mendes Bowland 1998 • Узел LCom #{lane.id}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {mode === "emulation" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => throwNow.mutate(laneId)}
              disabled={throwNow.isPending}
              className="text-xs bg-amber-950/40 border border-amber-600/40 text-amber-300 hover:bg-amber-900/50 hover:text-white"
            >
              <PlayCircle className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              Симулировать бросок
            </Button>
          )}

          {/* Open TV button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/tv/${laneId}`, "_blank")}
            className="text-xs border-teal-800/80 bg-teal-950/30 text-teal-300 hover:bg-teal-900/40 hover:text-white"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-teal-400" />
            Открыть TV
          </Button>

          {/* Reset button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="text-xs hover:bg-amber-950/60 hover:text-amber-300 hover:border-amber-700/50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Сброс (Reset)
          </Button>

          {/* New Frame button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => newFrameMutation.mutate()}
            disabled={newFrameMutation.isPending}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            <SkipForward className="w-3.5 h-3.5 text-sky-400" />
            Новый фрейм
          </Button>

          <LaneThrowButton laneId={lane.id} />

          {/* Start Game button */}
          <Button
            size="sm"
            onClick={() => setStartGameDialogOpen(true)}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 font-semibold"
          >
            <Play className="w-3.5 h-3.5" />
            Начать игру
          </Button>
        </div>
      </div>

      {/* 2. ScoreBoard Section */}
      <ScoreBoard
        players={
          activeGame?.players ||
          (lane.current_game
            ? [
                {
                  id: lane.current_game.id || "p-current",
                  name: lane.current_game.player_name,
                  is_current: true,
                  total_score: lane.current_game.score,
                  frames: [],
                },
              ]
            : [])
        }
        currentFrame={lane.current_game?.current_frame || activeGame?.current_frame || 1}
      />

      {/* 3 & 4. Two-Column Operational Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Interactive Pinsetter & JSON PinState */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Пинсеттер и матрица кеглей
                </CardTitle>
                <CardDescription className="text-xs">
                  Клик по кегле переключает состояние (ручной ввод / отладка)
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400">
                {lane.pins.filter(Boolean).length}/10 стоят
              </span>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Large Interactive Pin Triangle */}
              <div className="flex justify-center py-2">
                <PinTriangle
                  pins={lane.pins}
                  interactive={true}
                  onTogglePin={handleTogglePin}
                  size="lg"
                  className="w-56 h-56"
                />
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetAllPins(true)}
                  className="text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Все стоят (10)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetAllPins(false)}
                  className="text-xs hover:border-amber-700/50 hover:text-amber-400"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Все сбиты (Strike)
                </Button>
              </div>

              {/* Throw ball simulation */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSimulateShot}
                className="w-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
              >
                Зарегистрировать бросок с текущей позиции
              </Button>

              {/* PinState JSON viewer */}
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span className="font-mono font-medium">PinState (10 Pins Array):</span>
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                  >
                    {copiedJson ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copiedJson ? "Скопировано" : "Копировать"}
                  </button>
                </div>

                <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800/80 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-inner">
                  {JSON.stringify(
                    {
                      pins_state: lane.pins,
                      standing: lane.pins.filter(Boolean).length,
                      knocked_down: 10 - lane.pins.filter(Boolean).length,
                      foul1: lane.foul1,
                      foul2: lane.foul2,
                      speed: lane.speed,
                    },
                    null,
                    2
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7 Cols): LaneOptionsPanel & ShotTimeline */}
        <div className="lg:col-span-7 space-y-6">
          <LaneOptionsPanel
            laneId={lane.id}
            options={lane.options}
            onOptionsChange={(newOpts) => {
              queryClient.setQueryData<Lane>(["lane", laneId], (old) => {
                if (!old) return old;
                return { ...old, options: { ...old.options, ...newOpts } };
              });
            }}
          />

          <ShotTimeline
            shots={lane.shots}
            playerName={lane.current_game?.player_name}
          />
        </div>
      </div>

      {/* 5. Bottom Tabs: Traffic & Notes */}
      <Tabs defaultValue="traffic" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="traffic" className="gap-2 text-xs">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            LCom RS-485 Traffic (Hex)
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2 text-xs">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            Заметки оператора (Notes)
          </TabsTrigger>
        </TabsList>

        {/* Traffic Tab */}
        <TabsContent value="traffic">
          <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Сырой трафик пакетов шины LCom
                </CardTitle>
                <CardDescription className="text-xs">
                  Кадры обмена между ESP32 TCP Bridge и узлом пары #{Math.ceil(lane.number / 2)}
                </CardDescription>
              </div>
              <span className="font-mono text-xs text-zinc-500">
                19200 Baud • 8N1 • XOR: 0x00
              </span>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs space-y-2.5 overflow-x-auto shadow-inner">
                {mockPackets.map((pkt, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-zinc-500">[{i + 1}]</span>
                      <span className="text-emerald-400 font-bold">
                        {pkt.cmdName}
                      </span>
                      <span className="text-zinc-300 text-[11px] truncate max-w-xs">
                        Кадр узла #{pkt.laneId} ({pkt.payload.length} байт)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 text-[11px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        HEX: {formatFrameHex(pkt.raw).slice(0, 36)}...
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          pkt.checksumOk
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}
                      >
                        CRC {pkt.checksumOk ? "OK" : "ERR"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Заметки механика и оператора дорожки
              </CardTitle>
              <CardDescription className="text-xs">
                Локальный журнал обслуживания, замена тросов, калибровка оптических датчиков
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                rows={5}
                placeholder="Внесите записи о техническом состоянии дорожки #... (сохраняется локально)"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex justify-end">
                <Button onClick={handleSaveNotes} size="sm" className="text-xs">
                  Сохранить заметки
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title={`Сбросить пинсеттер дорожки #${lane.number}?`}
        description="Контроллер Mendes Bowland запустит полный цикл очистки и выставления всех 10 кеглей. Фолы и заступы будут сброшены."
        confirmLabel="Сбросить кегли"
        variant="destructive"
        isLoading={resetMutation.isPending}
        onConfirm={() => resetMutation.mutate()}
      />

      {/* Start Game Modal */}
      <StartGameDialog 
        open={startGameDialogOpen} 
        onOpenChange={setStartGameDialogOpen} 
        laneId={laneId} 
      />
    </div>
  );
}
