import { Terminal, Construction, Play, Square, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export function Emulator() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Эмулятор Mendes Bowland
            </h1>
            <Badge variant="outline" className="border-amber-700/50 text-amber-400 bg-amber-950/40">
              В разработке
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Программный симулятор аппаратных ответов пинсеттеров и консолей для отладки без дорожек
          </p>
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <CardTitle>Виртуальный стек LCom RS-485</CardTitle>
          </div>
          <CardDescription>
            Эмуляция протокола 1998 года для 12 пар дорожек (48 виртуальных узлов)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4">
              <Construction className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">
              Эмулятор аппаратного уровня LCom
            </h3>
            <p className="text-sm text-zinc-400 max-w-md mt-2 leading-relaxed">
              В данный момент эмуляция данных работает через MSW Service Worker. Расширенная панель инъекции ошибок шины, имитации застревания кеглей и таймаутов RS-485 будет доступна в следующем релизе.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <Button variant="outline" disabled className="gap-2 text-xs">
                <Play className="w-3.5 h-3.5" /> Запустить симуляцию
              </Button>
              <Button variant="secondary" disabled className="gap-2 text-xs">
                <Square className="w-3.5 h-3.5" /> Остановить
              </Button>
              <Button variant="ghost" disabled className="gap-2 text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Сбросить состояние
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
