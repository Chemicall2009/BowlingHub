import { useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Settings as SettingsIcon,
  Menu,
  Activity,
  Terminal,
  FlaskConical,
  Zap,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useUIStore } from "../../stores/ui";
import { useConnectionStore } from "../../stores/connection";
import { ModeSwitcher } from "../common/ModeSwitcher";
import { TvPanelSelectorModal } from "../common/TvPanelSelectorModal";
import { useOperationMode } from "../../stores/operationMode";
import { useEmulationStatus } from "../../api/emulation";
import { cn } from "../../lib/utils";

function EmulationIndicator() {
  const mode = useOperationMode((s) => s.mode);
  const { data } = useEmulationStatus();
  const activeCount = Array.isArray(data?.active_lanes) ? data.active_lanes.length : 0;
  if (mode !== "emulation" || activeCount === 0) {
    return null;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
          <Activity className="h-3.5 w-3.5" />
          SIM {activeCount}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Активно симулируется {activeCount} дорожек
      </TooltipContent>
    </Tooltip>
  );
}

function ModeBadge() {
  const mode = useOperationMode((s) => s.mode);
  const isEmu = mode === "emulation";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wider cursor-pointer",
            isEmu
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          )}
        >
          {isEmu ? (
            <FlaskConical className="h-3.5 w-3.5" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          {isEmu ? "EMU" : "LIVE"}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isEmu
          ? "Режим эмуляции — оборудование виртуальное, данные не влияют на реальные дорожки"
          : "Боевой режим — работа с реальным оборудованием"}
      </TooltipContent>
    </Tooltip>
  );
}

export function Topbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme, toggleSidebar } = useUIStore();
  const { status, getDisplayString, lastPingMs, rxPacketsSec } = useConnectionStore();

  const statusColors = {
    connected: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
    connecting: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
    degraded: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
    disconnected: "bg-red-400 shadow-[0_0_8px_#f87171]",
  }[status];

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Mobile Menu + Hardware Connection Status */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="iconSm"
          className="md:hidden text-zinc-300"
          onClick={toggleSidebar}
          aria-label="Переключить меню"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Connection pill */}
        <div className="flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 shadow-inner">
          <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${statusColors}`} />
          <span className="font-mono text-xs font-medium text-zinc-200">
            {getDisplayString()}
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500 border-l border-zinc-800 pl-2">
            {lastPingMs} ms • {rxPacketsSec} pkt/s
          </span>
        </div>

        <TooltipProvider>
          <ModeBadge />
          <EmulationIndicator />
        </TooltipProvider>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2">
        {/* Mode Switcher */}
        <ModeSwitcher />

        {/* TV Panel Selector */}
        <TvPanelSelectorModal />

        <TooltipProvider>
          {/* Hardware Bus status badge */}
          <Badge
            variant="outline"
            className="hidden lg:flex items-center gap-1.5 text-xs font-mono py-1 border-zinc-800 text-zinc-400"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            LCom Bus (RS-485) OK
          </Badge>

          {/* Quick Emulator link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="iconSm"
                className="text-zinc-400 hover:text-white"
                onClick={() => navigate("/emulator")}
              >
                <Terminal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Эмулятор Mendes Bowland</TooltipContent>
          </Tooltip>

          {/* Theme switcher */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="iconSm"
                className="text-zinc-400 hover:text-white"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-sky-400" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
            </TooltipContent>
          </Tooltip>

          {/* Settings button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="iconSm"
                className="text-zinc-400 hover:text-white"
                onClick={() => navigate("/settings")}
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Настройки оборудования</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
