/**
 * @file src/components/calibration/CalibrationWizard.tsx
 * @description Интерактивный 4-шаговый мастер калибровки камер подсчёта очков.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Sparkles,
  Play,
  RotateCcw,
  AlertTriangle,
  ZoomIn,
  Eye,
  Grid,
} from "lucide-react";
import {
  useCalibrationProfiles,
  useCreateProfile,
  useUpdateProfile,
  useUploadSnapshot,
  useTestCalibration,
  type CalibrationCameraType,
  type Point,
  type CalibrationTestResult,
} from "../../api/calibration";
import { useCalibrationWizardStore } from "../../stores/calibrationWizard";
import { CameraTypeSelect } from "./CameraTypeSelect";
import { CameraSelect } from "./CameraSelect";
import { CalibrationCanvas } from "./CalibrationCanvas";
import { PinPositionList, getStandardPinLayout } from "./PinPositionList";
import { RoiEditor } from "./RoiEditor";
import { PinTriangle } from "../lane/PinTriangle";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { generateMockPinDeckSvg } from "../../mocks/handlers/calibration";

export interface CalibrationWizardProps {
  initialLaneId?: number;
  profileId?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

const STEPS = [
  { step: 1, title: "Дорожка и камера", desc: "Выбор оптики" },
  { step: 2, title: "Эталонный кадр", desc: "Снимок пиндека" },
  { step: 3, title: "Разметка", desc: "Кегли и ROI" },
  { step: 4, title: "Проверка", desc: "Тест детекции" },
];

export function CalibrationWizard({
  initialLaneId,
  profileId,
  onComplete,
  onCancel,
}: CalibrationWizardProps) {
  const wizard = useCalibrationWizardStore();
  const { data: existingProfiles = [] } = useCalibrationProfiles();

  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();
  const uploadMutation = useUploadSnapshot(wizard.laneId || 1);
  const testMutation = useTestCalibration();

  // Локальные состояния редактора разметки (Шаг 3)
  const [editorMode, setEditorMode] = useState<"pins" | "roi" | "view">("pins");
  const [zoom, setZoom] = useState<number>(1);
  const [opacity, setOpacity] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [selectedPinIndex, setSelectedPinIndex] = useState<number | null>(null);

  // Тестовый результат (Шаг 4)
  const [testResult, setTestResult] = useState<CalibrationTestResult | null>(null);

  // Инициализация при монтировании или смене profileId / initialLaneId
  useEffect(() => {
    if (initialLaneId && !wizard.profileId) {
      wizard.setLane(initialLaneId);
    }

    if (profileId) {
      const found = existingProfiles.find((p) => p.id === profileId);
      if (found) {
        wizard.setIsEditing(true, found.id);
        wizard.setLane(found.lane_id);
        wizard.setCameraType(found.camera_type);
        wizard.setSnapshot(found.reference_frame_url);
        wizard.setPinPositions(found.pin_positions);
        wizard.setPolygonRoi(found.polygon_roi);
      }
    }
  }, [profileId, initialLaneId, existingProfiles]);

  // Проверка дубликата профиля на Шаге 1
  const existingProfileForLane = existingProfiles.find(
    (p) =>
      p.lane_id === wizard.laneId &&
      p.camera_type === wizard.cameraType &&
      p.id !== wizard.profileId
  );

  // Обработка загрузки файла (Шаг 2)
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 5 МБ");
        return;
      }

      try {
        const res = await uploadMutation.mutateAsync(file);
        wizard.setSnapshot(res.url);
        toast.success("Эталонный кадр успешно загружен");
      } catch {
        toast.error("Не удалось загрузить изображение");
      }
    },
    [uploadMutation, wizard]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxFiles: 1,
  });

  // Автогенерация тестового снимка, если нет
  const currentSnapshotUrl =
    wizard.snapshotUrl || generateMockPinDeckSvg(wizard.laneId || 1);

  // Переход далее
  const handleNext = () => {
    if (wizard.step === 1) {
      if (!wizard.laneId || wizard.laneId < 1 || wizard.laneId > 48) {
        toast.error("Укажите корректный номер дорожки (1..48)");
        return;
      }
      wizard.setStep(2);
    } else if (wizard.step === 2) {
      if (!wizard.snapshotUrl) {
        // Устанавливаем дефолтный кадр
        wizard.setSnapshot(generateMockPinDeckSvg(wizard.laneId || 1));
      }
      wizard.setStep(3);
    } else if (wizard.step === 3) {
      wizard.setStep(4);
    }
  };

  const handlePrev = () => {
    if (wizard.step > 1) {
      wizard.setStep((wizard.step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleCancel = () => {
    wizard.reset();
    onCancel?.();
  };

  // Запуск теста калибровки (Шаг 4)
  const handleRunTest = async () => {
    try {
      const res = await testMutation.mutateAsync({
        profileId: wizard.profileId || "prof-test",
        testSnapshotUrl: currentSnapshotUrl,
      });
      setTestResult(res);
      toast.success("Тест калибровки успешно выполнен");
    } catch {
      toast.error("Ошибка при проверке калибровки");
    }
  };

  // Финальное сохранение
  const handleSaveProfile = async () => {
    const laneId = wizard.laneId || 1;
    const pinPositions = wizard.pinPositions || getStandardPinLayout(640, 480);
    const polygonRoi = wizard.polygonRoi || [
      { x: 180, y: 110 },
      { x: 460, y: 110 },
      { x: 500, y: 300 },
      { x: 140, y: 300 },
    ];

    try {
      if (wizard.isEditing && wizard.profileId) {
        await updateMutation.mutateAsync({
          id: wizard.profileId,
          dto: {
            lane_id: laneId,
            camera_id: wizard.cameraId || undefined,
            camera_type: wizard.cameraType,
            pin_positions: pinPositions,
            polygon_roi: polygonRoi,
            reference_frame_url: currentSnapshotUrl,
            is_active: true,
          },
        });
      } else {
        await createMutation.mutateAsync({
          lane_id: laneId,
          camera_id: wizard.cameraId || undefined,
          camera_type: wizard.cameraType,
          pin_positions: pinPositions,
          polygon_roi: polygonRoi,
          reference_frame_url: currentSnapshotUrl,
          is_active: true,
          notes: `Создан через мастер калибровки (${wizard.cameraType.toUpperCase()})`,
        });
      }

      wizard.reset();
      onComplete?.();
    } catch {
      // Ошибка обрабатывается мутацией
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Верхний Stepper */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((s) => {
            const isCompleted = wizard.step > s.step;
            const isCurrent = wizard.step === s.step;

            return (
              <div
                key={s.step}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? "border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/40"
                    : isCompleted
                    ? "border-emerald-800/40 bg-zinc-900/40 text-zinc-300"
                    : "border-zinc-800/60 bg-zinc-900/20 text-zinc-500"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                    isCurrent
                      ? "bg-emerald-500 text-zinc-950"
                      : isCompleted
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-700/60"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate text-zinc-100">
                    {s.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Тело текущего шага */}
      {/* ШАГ 1: Дорожка и камера */}
      {wizard.step === 1 && (
        <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                Шаг 1. Выберите дорожку и тип камеры
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Каждая дорожка может иметь оптический сенсор над пиндеком или консольную камеру T-Vision.
              </p>
            </div>

            {/* Выбор номера дорожки */}
            <div className="space-y-2">
              <Label htmlFor="lane-select" className="text-xs font-semibold text-zinc-200">
                Номер дорожки (1..48)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="lane-select"
                  type="number"
                  min={1}
                  max={48}
                  value={wizard.laneId || 1}
                  onChange={(e) => wizard.setLane(Number(e.target.value) || 1)}
                  className="w-32 bg-zinc-950 border-zinc-700 font-mono text-base font-bold text-emerald-400"
                />
                <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800">
                  Спаренная пара дорожек: #{Math.ceil((wizard.laneId || 1) / 2)}
                </span>
              </div>
            </div>

            {/* Выбор физической камеры */}
            <CameraSelect
              value={wizard.cameraId || undefined}
              onChange={wizard.setCameraId}
            />

            {/* Выбор типа камеры */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-200">
                Тип оптического датчика
              </Label>
              <CameraTypeSelect
                value={wizard.cameraType}
                onChange={wizard.setCameraType}
              />
            </div>

            {/* Предупреждение о существующем профиле */}
            {existingProfileForLane && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-600/40 bg-amber-950/20 text-amber-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-amber-300">
                    Найден существующий профиль для дорожки #{wizard.laneId} ({wizard.cameraType.toUpperCase()})
                  </div>
                  <div>
                    Вы можете продолжить редактирование существующего профиля или заменить его новой калибровкой.
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      wizard.setIsEditing(true, existingProfileForLane.id);
                      wizard.setSnapshot(existingProfileForLane.reference_frame_url);
                      wizard.setPinPositions(existingProfileForLane.pin_positions);
                      wizard.setPolygonRoi(existingProfileForLane.polygon_roi);
                      toast.info("Загружены параметры существующего профиля");
                    }}
                    className="mt-2 h-7 text-xs border-amber-500/50 bg-amber-900/30 text-amber-100 hover:bg-amber-900/60"
                  >
                    Загрузить данные профиля #{existingProfileForLane.id}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ШАГ 2: Эталонный кадр */}
      {wizard.step === 2 && (
        <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                Шаг 2. Загрузка эталонного кадра с камеры
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Кадр должен содержать пустой пиндек со всеми 10 установленными кеглями при рабочем клубном освещении.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer min-h-[260px] ${
                  isDragActive
                    ? "border-emerald-500 bg-emerald-950/20 shadow-xl"
                    : "border-zinc-700 bg-zinc-950/60 hover:border-zinc-500 hover:bg-zinc-900/40"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 mb-3 shadow-inner">
                  <UploadCloud className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="text-sm font-semibold text-zinc-100 text-center">
                  Перетащите изображение сюда или кликните
                </div>
                <div className="text-xs text-zinc-400 mt-1 text-center">
                  Поддерживаются форматы PNG, JPG (до 5 МБ)
                </div>
                {uploadMutation.isPending && (
                  <div className="mt-3 text-xs text-emerald-400 font-mono animate-pulse">
                    Загрузка на сервер...
                  </div>
                )}
              </div>

              {/* Превью снимка */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">
                    Текущий эталонный кадр
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      wizard.setSnapshot(generateMockPinDeckSvg(wizard.laneId || 1));
                      toast.info("Сгенерирован стандартный тестовый снимок камеры");
                    }}
                    className="h-7 text-xs text-zinc-400 hover:text-white"
                  >
                    Использовать тестовый кадр
                  </Button>
                </div>

                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner flex items-center justify-center">
                  <img
                    src={currentSnapshotUrl}
                    alt="Эталонный кадр"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 font-mono text-[10px] bg-black/75 text-emerald-400 px-2 py-0.5 rounded border border-zinc-800">
                    LANE #{wizard.laneId} • 640x480
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ШАГ 3: Интерактивная разметка */}
      {wizard.step === 3 && (
        <div className="space-y-4">
          {/* Верхняя панель инструментов редактора */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-950">
            {/* Режим редактирования */}
            <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <Button
                variant={editorMode === "pins" ? "default" : "ghost"}
                size="sm"
                onClick={() => setEditorMode("pins")}
                className={`h-7 text-xs ${
                  editorMode === "pins"
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Точки кеглей (10)
              </Button>
              <Button
                variant={editorMode === "roi" ? "default" : "ghost"}
                size="sm"
                onClick={() => setEditorMode("roi")}
                className={`h-7 text-xs ${
                  editorMode === "roi"
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Область ROI (4)
              </Button>
              <Button
                variant={editorMode === "view" ? "default" : "ghost"}
                size="sm"
                onClick={() => setEditorMode("view")}
                className={`h-7 text-xs ${
                  editorMode === "view"
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Просмотр
              </Button>
            </div>

            {/* Слайдеры зума и прозрачности */}
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2 w-32">
                <ZoomIn className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <Slider
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={([val]) => setZoom(val)}
                />
                <span className="w-10 text-right">{(zoom * 100).toFixed(0)}%</span>
              </div>

              <div className="flex items-center gap-2">
                <Grid className="w-3.5 h-3.5 text-zinc-500" />
                <Switch
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                  id="grid-toggle"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const std = getStandardPinLayout(640, 480);
                  wizard.setPinPositions(std);
                  toast.success("Точки установлены в стандартный треугольник");
                }}
                className="h-7 text-xs border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Автораскладка
              </Button>
            </div>
          </div>

          {/* Сетка: Canvas слева, редакторы списков справа */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <CalibrationCanvas
                imageUrl={currentSnapshotUrl}
                width={640}
                height={480}
                pinPositions={wizard.pinPositions || getStandardPinLayout(640, 480)}
                polygonRoi={
                  wizard.polygonRoi || [
                    { x: 180, y: 110 },
                    { x: 460, y: 110 },
                    { x: 500, y: 300 },
                    { x: 140, y: 300 },
                  ]
                }
                onPinPositionsChange={wizard.setPinPositions}
                onPolygonRoiChange={wizard.setPolygonRoi}
                mode={editorMode}
                showGrid={showGrid}
                zoom={zoom}
                backgroundOpacity={opacity}
                highlightedPinIndex={selectedPinIndex}
                onPinSelect={setSelectedPinIndex}
                onZoomChange={setZoom}
              />
            </div>

            <div className="lg:col-span-5 space-y-4">
              {editorMode === "roi" ? (
                <RoiEditor
                  polygonRoi={
                    wizard.polygonRoi || [
                      { x: 180, y: 110 },
                      { x: 460, y: 110 },
                      { x: 500, y: 300 },
                      { x: 140, y: 300 },
                    ]
                  }
                  onChange={wizard.setPolygonRoi}
                />
              ) : (
                <PinPositionList
                  pinPositions={
                    wizard.pinPositions || getStandardPinLayout(640, 480)
                  }
                  onChange={wizard.setPinPositions}
                  selectedPinIndex={selectedPinIndex}
                  onSelectPin={setSelectedPinIndex}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ШАГ 4: Проверка и тестирование */}
      {wizard.step === 4 && (
        <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Шаг 4. Контрольная проверка распознавания
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Сверьте наложение разметки с тестовым кадром и оцените уверенность детектора кеглей.
                </p>
              </div>

              <Button
                onClick={handleRunTest}
                disabled={testMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-medium self-start sm:self-auto"
              >
                <Play className="w-4 h-4 fill-current" />
                {testMutation.isPending ? "Анализ кадра..." : "Тестировать калибровку"}
              </Button>
            </div>

            {testResult ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
                {/* Левая колонка: Debug Overlay изображение */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="text-xs font-semibold text-zinc-300">
                    Накладка детектора (Debug Overlay)
                  </div>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner">
                    <img
                      src={testResult.debug_overlay_url}
                      alt="Тестовый оверлей"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Правая колонка: PinTriangle + метрики уверенности */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-3">
                    <div className="text-xs font-semibold text-zinc-200">
                      Распознанная конфигурация кеглей
                    </div>
                    <div className="flex justify-center p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
                      <PinTriangle
                        pins={testResult.detected_pins}
                        size="md"
                      />
                    </div>
                    <div className="text-center font-mono text-xs text-zinc-400">
                      Стоит кеглей:{" "}
                      <span className="text-emerald-400 font-bold">
                        {testResult.detected_pins.filter(Boolean).length}
                      </span>{" "}
                      из 10
                    </div>
                  </div>

                  {/* Индикатор уверенности (Confidence) */}
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-2 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Уверенность AI:</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {(testResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${testResult.confidence * 100}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-zinc-500 pt-1">
                      {testResult.confidence > 0.85
                        ? "Отличная четкость: профиль готов к боевой эксплуатации."
                        : "Удовлетворительно: рекомендуется уточнить освещение дорожки."}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
                <Play className="w-10 h-10 text-emerald-500/60 mb-2" />
                <div className="text-sm font-semibold text-zinc-200">
                  Тест еще не запущен
                </div>
                <div className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Нажмите "Тестировать калибровку", чтобы программно проверить детекцию кеглей по установленным координатам.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Нижняя панель навигации по шагам */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-zinc-950">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white text-xs"
        >
          Отменить мастер
        </Button>

        <div className="flex items-center gap-2">
          {wizard.step > 1 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 gap-1.5 text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </Button>
          )}

          {wizard.step < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs font-semibold"
            >
              Далее
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSaveProfile}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-bold shadow-lg shadow-emerald-950/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              {createMutation.isPending || updateMutation.isPending
                ? "Сохранение..."
                : wizard.isEditing
                ? "Обновить профиль"
                : "Сохранить профиль"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
