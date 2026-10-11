/**
 * @file src/components/settings/TransportTab.tsx
 * @description Вкладка настроек физического транспорта (Serial / TCP / Mock) с тестом связи.
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Cable, Wifi, FlaskConical, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { testConnection } from "../../api/settings";
import type { SettingsFormValues } from "../../lib/settingsSchema";
import { toast } from "sonner";

export function TransportTab() {
  const { register, watch, setValue } = useFormContext<SettingsFormValues>();
  const transport = watch("transport");
  const serialPort = watch("serial_port");
  const serialBaud = watch("serial_baud");
  const tcpHost = watch("tcp_host");
  const tcpPort = watch("tcp_port");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latency_ms: number } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection({
        transport,
        serial_port: serialPort,
        serial_baud: serialBaud,
        tcp_host: tcpHost,
        tcp_port: tcpPort,
      });
      setTestResult(res);
      if (res.ok) {
        toast.success("Связь успешно проверена!");
      } else {
        toast.error("Ошибка проверки связи с мостом");
      }
    } catch {
      setTestResult({ ok: false, message: "Сетевая ошибка при запросе к мосту", latency_ms: 0 });
      toast.error("Не удалось выполнить тест соединения");
    } finally {
      setTesting(false);
    }
  };

  const handleTransportChange = (newTransport: "serial" | "tcp" | "mock") => {
    if (newTransport !== transport) {
      const confirmed = window.confirm(
        "Переключение режима транспорта может сбросить текущие параметры подключения. Продолжить?"
      );
      if (confirmed) {
        setValue("transport", newTransport, { shouldDirty: true });
        setTestResult(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Выбор физического транспорта</h2>
        <p className="text-xs text-zinc-400">Способ подключения управляющего ПК к шине LCom / кеглетранспортеру.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Serial Card */}
        <div
          onClick={() => handleTransportChange("serial")}
          className={`cursor-pointer rounded-xl border p-4 flex flex-col gap-3 transition-all ${
            transport === "serial"
              ? "bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-500/10"
              : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-lg ${transport === "serial" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>
              <Cable className="h-5 w-5" />
            </div>
            {transport === "serial" && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-semibold">Активен</span>}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">USB-RS485</h3>
            <p className="text-xs text-zinc-400 mt-1">Прямое подключение через адаптер (FTDI / CP2102).</p>
          </div>
        </div>

        {/* TCP Card */}
        <div
          onClick={() => handleTransportChange("tcp")}
          className={`cursor-pointer rounded-xl border p-4 flex flex-col gap-3 transition-all ${
            transport === "tcp"
              ? "bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-500/10"
              : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-lg ${transport === "tcp" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>
              <Wifi className="h-5 w-5" />
            </div>
            {transport === "tcp" && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-semibold">Активен</span>}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">TCP / Wi-Fi Мост</h3>
            <p className="text-xs text-zinc-400 mt-1">Беспроводной мост на ESP32 / ESP8266.</p>
          </div>
        </div>

        {/* Mock Card */}
        <div
          onClick={() => handleTransportChange("mock")}
          className={`cursor-pointer rounded-xl border p-4 flex flex-col gap-3 transition-all ${
            transport === "mock"
              ? "bg-blue-950/30 border-blue-500 shadow-lg shadow-blue-500/10"
              : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-lg ${transport === "mock" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}>
              <FlaskConical className="h-5 w-5" />
            </div>
            {transport === "mock" && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-semibold">Активен</span>}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Эмулятор (Mock)</h3>
            <p className="text-xs text-zinc-400 mt-1">Виртуальная шина для отладки без оборудования.</p>
          </div>
        </div>
      </div>

      {/* Параметры выбранного транспорта */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white">Параметры соединения ({transport.toUpperCase()})</h3>

        {transport === "serial" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-zinc-300">Путь к порту</Label>
              <Input {...register("serial_port")} placeholder="/dev/ttyUSB0" className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-zinc-300">Скорость (Baud rate)</Label>
              <Select
                value={serialBaud?.toString()}
                onValueChange={(val) => setValue("serial_baud", parseInt(val, 10) as any, { shouldDirty: true })}
              >
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200">
                  <SelectValue placeholder="Выберите скорость" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="9600">9600 бод</SelectItem>
                  <SelectItem value="19200">19200 бод</SelectItem>
                  <SelectItem value="38400">38400 бод</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {transport === "tcp" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-zinc-300">IP-адрес / Хост моста</Label>
              <Input {...register("tcp_host")} placeholder="192.168.4.1" className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-zinc-300">TCP Порт</Label>
              <Input
                type="number"
                {...register("tcp_port", { valueAsNumber: true })}
                placeholder="2323"
                className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
              />
            </div>
          </div>
        )}

        {transport === "mock" && (
          <div className="bg-blue-950/30 border border-blue-900/60 p-4 rounded-lg text-xs text-blue-200">
            Режим эмуляции активен. Все команды шины обрабатываются встроенным MSW-мостом в памяти браузера. Реальное железо не задействовано.
          </div>
        )}

        {/* Кнопка теста и результат */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
            className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Проверка связи..." : "Проверить связь"}
          </Button>

          {testResult && (
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${testResult.ok ? "bg-emerald-950/50 border-emerald-800/80 text-emerald-300" : "bg-red-950/50 border-red-800/80 text-red-300"}`}>
              {testResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
