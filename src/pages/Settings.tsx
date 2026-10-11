/**
 * @file src/pages/Settings.tsx
 * @description Главная страница настроек приложения со всеми вкладками, реактивными формами и валидацией Zod.
 */

import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings as SettingsIcon, Save, RotateCcw, Sliders, Shield, LayoutGrid, Bell, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { getSettings, updateSettings } from "../api/settings";
import { settingsSchema, type SettingsFormValues } from "../lib/settingsSchema";
import { useSettingsUIStore } from "../stores/settings";

import { TransportTab } from "../components/settings/TransportTab";
import { ProtocolTab } from "../components/settings/ProtocolTab";
import { LanesTab } from "../components/settings/LanesTab";
import { NotificationsTab } from "../components/settings/NotificationsTab";
import { AboutTab } from "../components/settings/AboutTab";
import { toast } from "sonner";

export function Settings() {
  const { activeTab, setActiveTab } = useSettingsUIStore();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const methods = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      transport: "serial",
      serial_port: "/dev/ttyUSB0",
      serial_baud: 9600,
      tcp_host: "192.168.4.1",
      tcp_port: 2323,
      xor_mask_hex: "00",
      checksum_variant: "sum256",
      frame_length: 30,
      lanes_count: 12,
      lanes_start_number: 1,
      poll_interval_ms: 15,
      poll_timeout_ms: 30,
      inter_packet_delay_ms: 15,
      auto_baud_switch: true,
      notifications: {
        on_lane_offline: true,
        on_checksum_error: true,
        on_connection_lost: true,
        sound_enabled: true,
        email_webhook: null,
      },
    },
  });

  const { reset, handleSubmit, formState: { isDirty, isSubmitting }, watch } = methods;
  const watchedValues = watch();

  useEffect(() => {
    if (settingsData) {
      reset({
        transport: settingsData.transport,
        serial_port: settingsData.serial_port,
        serial_baud: (settingsData.serial_baud as any) || 9600,
        tcp_host: settingsData.tcp_host,
        tcp_port: settingsData.tcp_port ?? 2323,
        xor_mask_hex: settingsData.xor_mask_hex || "00",
        checksum_variant: settingsData.checksum_variant || "sum256",
        frame_length: (settingsData.frame_length as any) || 30,
        lanes_count: settingsData.lanes_count || 12,
        lanes_start_number: (settingsData.lanes_start_number === 2 ? 2 : 1) as 1 | 2,
        poll_interval_ms: settingsData.poll_interval_ms || 15,
        poll_timeout_ms: settingsData.poll_timeout_ms || 30,
        inter_packet_delay_ms: settingsData.inter_packet_delay_ms || 15,
        auto_baud_switch: settingsData.auto_baud_switch ?? true,
        notifications: {
          on_lane_offline: settingsData.notifications?.on_lane_offline ?? true,
          on_checksum_error: settingsData.notifications?.on_checksum_error ?? true,
          on_connection_lost: settingsData.notifications?.on_connection_lost ?? true,
          sound_enabled: settingsData.notifications?.sound_enabled ?? true,
          email_webhook: settingsData.notifications?.email_webhook ?? null,
        },
      });
    }
  }, [settingsData, reset]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["lanes"] }); // Добавлено для обновления дашборда
      reset({
        ...updated,
        serial_baud: (updated.serial_baud as any) || 9600,
        frame_length: (updated.frame_length as any) || 30,
        lanes_start_number: (updated.lanes_start_number === 2 ? 2 : 1) as 1 | 2,
      });
      toast.success("Настройки успешно сохранены");
    },
    onError: () => {
      toast.error("Не удалость сохранить настройки");
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-400">
        Загрузка настроек...
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Настройки системы</h1>
              <p className="text-xs text-zinc-400">Управление параметрами шины, протокола и окружения</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="max-w-5xl mx-auto flex flex-col gap-6">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto grid grid-cols-2 sm:grid-cols-5 gap-1">
              <TabsTrigger value="transport" className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                <Sliders className="h-3.5 w-3.5" /> Транспорт
              </TabsTrigger>
              <TabsTrigger value="protocol" className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                <Shield className="h-3.5 w-3.5" /> Протокол LCom
              </TabsTrigger>
              <TabsTrigger value="lanes" className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                <LayoutGrid className="h-3.5 w-3.5" /> Дорожки
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                <Bell className="h-3.5 w-3.5" /> Уведомления
              </TabsTrigger>
              <TabsTrigger value="about" className="gap-2 text-xs py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                <Info className="h-3.5 w-3.5" /> О приложении
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transport">
              <TransportTab />
            </TabsContent>
            <TabsContent value="protocol">
              <ProtocolTab />
            </TabsContent>
            <TabsContent value="lanes">
              <LanesTab />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsTab />
            </TabsContent>
            <TabsContent value="about">
              <AboutTab currentValues={watchedValues} />
            </TabsContent>
          </Tabs>
        </div>

        {isDirty && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-zinc-900/95 border-t border-zinc-800 px-6 py-3.5 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <span>⚠️ Имеются несохранённые изменения в настройках</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  settingsData &&
                  reset({
                    ...settingsData,
                    serial_baud: (settingsData.serial_baud as any) || 9600,
                    frame_length: (settingsData.frame_length as any) || 30,
                    lanes_start_number: (settingsData.lanes_start_number === 2 ? 2 : 1) as 1 | 2,
                  })
                }
                disabled={isSubmitting}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Сбросить
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
              >
                <Save className="h-3.5 w-3.5" /> {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
