/**
 * @file src/pages/Calibration.tsx
 * @description Экран калибровки камер подсчёта очков с управлением профилями и интерактивным мастером разметки.
 */

import React, { useState } from "react";
import {
  Camera,
  Wand2,
  ListFilter,
  Plus,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import {
  useCalibrationProfiles,
  useActivateProfile,
  useDeleteProfile,
  useCreateProfile,
  useUpdateProfile,
  type CalibrationProfile,
  type CreateProfileDto,
} from "../api/calibration";
import { useCalibrationWizardStore } from "../stores/calibrationWizard";
import { ProfileList } from "../components/calibration/ProfileList";
import { CalibrationWizard } from "../components/calibration/CalibrationWizard";
import { ProfileFormDialog } from "../components/calibration/ProfileFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export function Calibration() {
  const [activeTab, setActiveTab] = useState<"profiles" | "wizard">("profiles");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMetadataProfile, setEditingMetadataProfile] =
    useState<CalibrationProfile | null>(null);

  const { data: rawProfiles, isLoading } = useCalibrationProfiles();
  const profiles: CalibrationProfile[] = Array.isArray(rawProfiles)
    ? rawProfiles
    : Array.isArray((rawProfiles as any)?.items)
    ? (rawProfiles as any).items
    : Array.isArray((rawProfiles as any)?.data)
    ? (rawProfiles as any).data
    : [];
  const activateMutation = useActivateProfile();
  const deleteMutation = useDeleteProfile();
  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();

  const wizard = useCalibrationWizardStore();

  // Открыть мастер для создания нового профиля
  const handleStartNewWizard = (laneId?: number) => {
    wizard.reset();
    if (laneId) wizard.setLane(laneId);
    setActiveTab("wizard");
  };

  // Редактирование геометрии через мастер
  const handleEditProfileInWizard = (profile: CalibrationProfile) => {
    wizard.setIsEditing(true, profile.id);
    wizard.setLane(profile.lane_id);
    wizard.setCameraType(profile.camera_type);
    wizard.setSnapshot(profile.reference_frame_url);
    wizard.setPinPositions(profile.pin_positions);
    wizard.setPolygonRoi(profile.polygon_roi);
    wizard.setStep(3); // Сразу на шаг разметки
    setActiveTab("wizard");
  };

  // Сохранение через модальный диалог метаданных
  const handleDialogSubmit = async (
    data: CreateProfileDto & { id?: string }
  ) => {
    if (data.id) {
      await updateMutation.mutateAsync({
        id: data.id,
        dto: data,
      });
    } else {
      await createMutation.mutateAsync({
        ...data,
        pin_positions: data.pin_positions || [],
        polygon_roi: data.polygon_roi || [],
      });
    }
    setDialogOpen(false);
    setEditingMetadataProfile(null);
  };

  const activeCount = profiles.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Калибровка камер подсчёта очков
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Юстировка оптических сенсоров T-Vision и Pin Deck для детекции 10 кеглей
              </p>
            </div>
          </div>
        </div>

        {/* Быстрые сводки в правом углу */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-zinc-800 bg-zinc-900/80 text-zinc-300 font-mono text-xs py-1.5 px-3"
          >
            Активно: <span className="text-emerald-400 font-bold ml-1">{activeCount}</span> / {profiles.length}
          </Badge>

          {activeTab === "profiles" && (
            <Button
              onClick={() => handleStartNewWizard()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold shadow-lg shadow-emerald-950/40"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Мастер калибровки
            </Button>
          )}
        </div>
      </div>

      {/* Верхние Табы: "Профили" и "Мастер калибровки" */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "profiles" | "wizard")}
        className="w-full space-y-6"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
            <TabsTrigger value="profiles" className="gap-2 text-xs">
              <ListFilter className="w-3.5 h-3.5" />
              Профили калибровки ({profiles.length})
            </TabsTrigger>
            <TabsTrigger value="wizard" className="gap-2 text-xs">
              <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
              Мастер калибровки
              {wizard.isEditing && (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-mono border border-emerald-800/40">
                  Правка
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === "profiles" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingMetadataProfile(null);
                setDialogOpen(true);
              }}
              className="h-8 gap-1.5 text-xs border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Быстрое создание
            </Button>
          )}
        </div>

        {/* Вкладка 1: Список профилей */}
        <TabsContent value="profiles" className="m-0 space-y-6">
          <ProfileList
            profiles={profiles}
            isLoading={isLoading}
            onEdit={handleEditProfileInWizard}
            onActivate={(id) => activateMutation.mutate(id)}
            onDelete={(id) => deleteMutation.mutate(id)}
            onCreateNew={() => handleStartNewWizard()}
            isActivating={activateMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        </TabsContent>

        {/* Вкладка 2: Мастер калибровки (Wizard) */}
        <TabsContent value="wizard" className="m-0">
          <CalibrationWizard
            profileId={wizard.profileId || undefined}
            onComplete={() => {
              setActiveTab("profiles");
            }}
            onCancel={() => {
              setActiveTab("profiles");
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Диалог быстрого создания/редактирования метаданных */}
      <ProfileFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialProfile={editingMetadataProfile}
        onSubmit={handleDialogSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
