import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Camera,
  Terminal,
  Radio,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Disc3,
  MonitorPlay,
} from "lucide-react";
import { useUIStore } from "../../stores/ui";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Дорожки",
    icon: LayoutGrid,
  },
  {
    to: "/calibration",
    label: "Калибровка",
    icon: Camera,
  },
  {
    to: "/emulator",
    label: "Эмулятор",
    icon: Terminal,
  },
  {
    to: "/sniffer",
    label: "Сниффер LCom",
    icon: Radio,
  },
  {
    to: "/tv/1",
    label: "TV-панель",
    icon: MonitorPlay,
    external: true,
  },
  {
    to: "/logs",
    label: "Журнал логов",
    icon: ScrollText,
  },
  {
    to: "/settings",
    label: "Настройки",
    icon: Settings,
  },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 md:static",
        sidebarOpen ? "w-64" : "w-20",
        // Mobile hidden when closed
        !sidebarOpen && "hidden md:flex"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-950/40">
            <Disc3 className="h-6 w-6 animate-spin-slow" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                Bowland Next
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Mendes AMF 1998
              </span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="iconSm"
          className="hidden md:flex text-zinc-400 hover:text-white"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Свернуть" : "Развернуть"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          if (item.external) {
            return (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors select-none text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                  !sidebarOpen && "justify-center px-2"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0 text-teal-400" />
                {sidebarOpen && <span>{item.label}</span>}
              </a>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors select-none",
                  isActive
                    ? "bg-emerald-600/15 text-emerald-400 border border-emerald-600/30 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                  !sidebarOpen && "justify-center px-2"
                )
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      {sidebarOpen && (
        <div className="border-t border-zinc-800 p-4">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
            <div className="text-xs font-semibold text-zinc-300">
              LCom RS-485 Мост
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 leading-snug">
              ESP32 TCP Bridge v2.4 • Замена DOS Bowland
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
