import { useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Settings as SettingsIcon,
  Menu,
  Activity,
  Terminal,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useUIStore } from "../../stores/ui";
import { useConnectionStore } from "../../stores/connection";

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
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2">
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
