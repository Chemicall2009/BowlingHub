/**
 * @file src/components/settings/NotificationsTab.tsx
 * @description Вкладка настройки уведомлений, звуков и вебхуков.
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Bell, Send, CheckCircle2 } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { testNotification } from "../../api/settings";
import type { SettingsFormValues } from "../../lib/settingsSchema";
import { toast } from "sonner";

export function NotificationsTab() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<SettingsFormValues>();
  const notifs = watch("notifications");
  const [testing, setTesting] = useState(false);

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      const res = await testNotification(notifs?.email_webhook);
      if (res.ok) {
        toast.success("Тестовое уведомление успешно отправлено!");
      }
    } catch {
      toast.error("Не удалось отправить тестовое уведомление");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Уведомления и Сигнализация</h2>
        <p className="text-xs text-zinc-400">Настройка триггеров алертов оператора, звуковых эффектов и вебхуков интеграции.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-400" /> События и Алерты
        </h3>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
            <div className="flex flex-col">
              <Label className="text-xs font-semibold text-zinc-200">Отключение дорожки</Label>
              <span className="text-[11px] text-zinc-400">Уведомлять оператора, когда дорожка перестает отвечать на поллинг.</span>
            </div>
            <Switch
              checked={notifs?.on_lane_offline}
              onCheckedChange={(checked) => setValue("notifications.on_lane_offline", checked, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
            <div className="flex flex-col">
              <Label className="text-xs font-semibold text-zinc-200">Ошибки контрольной суммы (CRC)</Label>
              <span className="text-[11px] text-zinc-400">Фиксировать и предупреждать при высоком уровне битых кадров на шине.</span>
            </div>
            <Switch
              checked={notifs?.on_checksum_error}
              onCheckedChange={(checked) => setValue("notifications.on_checksum_error", checked, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
            <div className="flex flex-col">
              <Label className="text-xs font-semibold text-zinc-200">Потеря связи с мостом</Label>
              <span className="text-[11px] text-zinc-400">Критический алерт при обрыве соединения с Serial/TCP мостом.</span>
            </div>
            <Switch
              checked={notifs?.on_connection_lost}
              onCheckedChange={(checked) => setValue("notifications.on_connection_lost", checked, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col">
              <Label className="text-xs font-semibold text-zinc-200">Звуковое сопровождение</Label>
              <span className="text-[11px] text-zinc-400">Воспроизводить аудио-сигнал в браузере при аварийных событиях.</span>
            </div>
            <Switch
              checked={notifs?.sound_enabled}
              onCheckedChange={(checked) => setValue("notifications.sound_enabled", checked, { shouldDirty: true })}
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white">Внешний Webhook / Email алерт</h3>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-zinc-300">URL вебхука (Discord / Telegram / Custom API)</Label>
          <div className="flex gap-2">
            <Input
              {...register("notifications.email_webhook")}
              placeholder="https://webhook.site/..."
              className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              disabled={testing}
              className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs hover:bg-zinc-700 hover:text-white flex-shrink-0 gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Тест
            </Button>
          </div>
          {errors.notifications?.email_webhook && (
            <span className="text-[11px] text-red-400">{errors.notifications.email_webhook.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
