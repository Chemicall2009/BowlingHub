#!/usr/bin/env bash
#
# fix-ai-studio.sh
# Восстанавливает стабильный baseline проекта после генераций AI Studio.
#
# AI Studio не читает файлы проекта — он держит весь код в чате
# и перезаписывает файлы своей текущей версией. Этот скрипт приводит
# критичные файлы (package.json, конфиги, FrameLog, mocks/browser)
# к рабочему состоянию.
#
# Использование:
#   ./scripts/fix-ai-studio.sh              # починить всё, показать отчёт
#   ./scripts/fix-ai-studio.sh --dry-run    # только показать что будет
#   ./scripts/fix-ai-studio.sh --commit     # починить + git commit
#   ./scripts/fix-ai-studio.sh --no-verify  # не запускать pnpm lint/build
#   ./scripts/fix-ai-studio.sh --help
#
# Возвращает 0 если после фиксов сборка проходит, иначе 1.

set -euo pipefail

# ------------------------- Флаги -------------------------
DRY_RUN=0
COMMIT=0
VERIFY=1

for arg in "$@"; do
  case "$arg" in
    -n|--dry-run) DRY_RUN=1 ;;
    --commit)     COMMIT=1 ;;
    --no-verify)  VERIFY=0 ;;
    -h|--help)
      sed -n '2,25p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Неизвестный флаг: $arg" >&2; exit 2 ;;
  esac
done

# ------------------------- Пути -------------------------
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [[ ! -f "package.json" ]]; then
  echo "❌ package.json не найден. Запусти из корня проекта." >&2
  exit 1
fi

BACKUP_ROOT="$PROJECT_ROOT/.fixup-backup"
BACKUP_DIR="$BACKUP_ROOT/$(date +%Y%m%d-%H%M%S)"

# ------------------------- Цвета -------------------------
if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'
  C_OK=$'\033[32m'
  C_FIX=$'\033[33m'
  C_ERR=$'\033[31m'
  C_DIM=$'\033[2m'
  C_BOLD=$'\033[1m'
else
  C_RESET="" C_OK="" C_FIX="" C_ERR="" C_DIM="" C_BOLD=""
fi

FIXED_COUNT=0

log_ok()  { echo "${C_OK}✓${C_RESET} $*"; }
log_fix() { echo "${C_FIX}✎${C_RESET} $*"; FIXED_COUNT=$((FIXED_COUNT+1)); }
log_err() { echo "${C_ERR}✗${C_RESET} $*" >&2; }
log_hdr() { echo; echo "${C_BOLD}── $* ──${C_RESET}"; }

backup_file() {
  local path="$1"
  [[ -f "$path" ]] || return 0
  local dst="$BACKUP_DIR/$path"
  mkdir -p "$(dirname "$dst")"
  cp -p "$path" "$dst"
}

# apply_file <path> <expected-content> <причина>
# Если содержимое отличается — бэкапит и перезаписывает.
apply_file() {
  local path="$1" expected="$2" reason="$3"

  if [[ ! -f "$path" ]]; then
    log_fix "$path — отсутствует, создаю ($reason)"
    if [[ $DRY_RUN -eq 0 ]]; then
      mkdir -p "$(dirname "$path")"
      printf '%s\n' "$expected" > "$path"
    fi
    return
  fi

  local current
  current="$(cat "$path")"

  if [[ "$current" == "$expected" ]]; then
    log_ok "$path"
    return
  fi

  log_fix "$path — $reason"
  if [[ $DRY_RUN -eq 0 ]]; then
    backup_file "$path"
    printf '%s\n' "$expected" > "$path"
  fi
}

# apply_sed <path> <regex> <замена> <причина>
# Точечная правка (для однострочных фиксов).
apply_sed() {
  local path="$1" pat="$2" repl="$3" reason="$4"
  [[ -f "$path" ]] || { log_err "$path — отсутствует"; return; }

  if ! grep -qE "$pat" "$path"; then
    log_ok "$path"
    return
  fi

  log_fix "$path — $reason"
  if [[ $DRY_RUN -eq 0 ]]; then
    backup_file "$path"
    sed -i -E "s|$pat|$repl|g" "$path"
  fi
}

echo "${C_BOLD}fix-ai-studio.sh${C_RESET}"
echo "Project: $PROJECT_ROOT"
[[ $DRY_RUN -eq 1 ]] && echo "${C_FIX}DRY-RUN — изменения не применяются${C_RESET}"
[[ $DRY_RUN -eq 0 ]] && echo "Backup:  $BACKUP_DIR"

# ============================================================
# 1. package.json — фиксированные версии
# ============================================================
log_hdr "package.json"

EXPECTED_PACKAGE_JSON='{
  "name": "bowland-next",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.9.1",
    "@radix-ui/react-alert-dialog": "^1.1.24",
    "@radix-ui/react-dialog": "^1.2.0",
    "@radix-ui/react-dropdown-menu": "^2.1.25",
    "@radix-ui/react-label": "^2.1.16",
    "@radix-ui/react-scroll-area": "^1.3.0",
    "@radix-ui/react-select": "^2.3.8",
    "@radix-ui/react-separator": "^1.1.16",
    "@radix-ui/react-slider": "^1.5.0",
    "@radix-ui/react-slot": "^1.4.0",
    "@radix-ui/react-switch": "^1.3.8",
    "@radix-ui/react-tabs": "^1.1.22",
    "@radix-ui/react-tooltip": "^1.3.0",
    "@tanstack/react-query": "^5.104.1",
    "@types/prismjs": "^1.26.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.4.0",
    "framer-motion": "^14.1.0",
    "lucide-react": "^0.546.0",
    "msw": "^2.15.0",
    "prismjs": "^1.30.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-dropzone": "^20.1.3",
    "react-hook-form": "^7.89.0",
    "react-router-dom": "^6.30.6",
    "react-simple-code-editor": "^0.14.1",
    "react-window": "^1.8.10",
    "recharts": "^3.10.1",
    "sonner": "^2.0.8",
    "tailwind-merge": "^3.7.0",
    "zod": "^4.6.5",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@types/node": "^22.20.5",
    "@types/react": "^18.3.31",
    "@types/react-dom": "^18.3.7",
    "@types/react-window": "^1.8.8",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/ui": "^2.1.9",
    "autoprefixer": "^10.6.1",
    "esbuild": "^0.25.12",
    "postcss": "^8.5.29",
    "tailwindcss": "^3.4.19",
    "tsx": "^4.23.15",
    "typescript": "^5.9.3",
    "vite": "^6.4.4",
    "vitest": "^2.1.9"
  },
  "msw": {
    "workerDirectory": ["public"]
  }
}'

apply_file "package.json" "$EXPECTED_PACKAGE_JSON" "восстановление зафиксированных версий (React 18, Vite 6, TS 5.9, Tailwind 3, MSW 2, react-window 1.8, plugin-react 4.x)"

# ============================================================
# 2. vite.config.ts
# ============================================================
log_hdr "vite.config.ts"

EXPECTED_VITE_CONFIG='import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    host: true,
  },
});'

apply_file "vite.config.ts" "$EXPECTED_VITE_CONFIG" "удаление @tailwindcss/vite и manualChunks"

# ============================================================
# 3. tsconfig.json
# ============================================================
log_hdr "tsconfig.json"

EXPECTED_TSCONFIG='{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "types": ["vite/client", "node"],

    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": false,

    "isolatedModules": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "noEmit": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "vite.config.ts"]
}'

apply_file "tsconfig.json" "$EXPECTED_TSCONFIG" "strict без noUnusedLocals/noImplicitOverride, paths @/* → src/*"

# ============================================================
# 4. src/index.css — синтаксис Tailwind 3
# ============================================================
log_hdr "src/index.css"

EXPECTED_INDEX_CSS='@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 5.5%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 5.5%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    border-color: hsl(var(--border));
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #52525b;
}'

apply_file "src/index.css" "$EXPECTED_INDEX_CSS" "замена @import \"tailwindcss\" на @tailwind директивы"

# ============================================================
# 5. postcss.config.js
# ============================================================
log_hdr "postcss.config.js"

EXPECTED_POSTCSS='export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};'

apply_file "postcss.config.js" "$EXPECTED_POSTCSS" "стандартный плагин tailwindcss + autoprefixer"

# ============================================================
# 6. tailwind.config.ts
# ============================================================
log_hdr "tailwind.config.ts"

EXPECTED_TAILWIND='import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;'

apply_file "tailwind.config.ts" "$EXPECTED_TAILWIND" "восстановление content paths + shadcn CSS-переменные"

# ============================================================
# 7. src/mocks/browser.ts — onUnhandledRequest, не onUnhandledFrame
# ============================================================
log_hdr "src/mocks/browser.ts"
apply_sed "src/mocks/browser.ts" \
  "onUnhandledFrame" \
  "onUnhandledRequest" \
  "замена onUnhandledFrame → onUnhandledRequest (MSW v2 API)"

# ============================================================
# 8. src/components/sniffer/FrameLog.tsx — react-window v1 API
# ============================================================
log_hdr "src/components/sniffer/FrameLog.tsx"

EXPECTED_FRAMELOG='/**
 * @file src/components/sniffer/FrameLog.tsx
 * @description Виртуализированный лог кадров с автоскроллом и индикатором новых сообщений.
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import { Radio, ArrowDown } from "lucide-react";
import { EmptyState } from "../common/EmptyState";
import { FrameRow } from "./FrameRow";
import type { SnifferFrame } from "../../api/sniffer";
import { Button } from "../ui/button";

interface FrameLogProps {
  frames: SnifferFrame[];
  selectedFrameId: string | null;
  onSelectFrame: (id: string) => void;
  autoScroll: boolean;
  onAutoScrollChange: (autoScroll: boolean) => void;
}

export function FrameLog({
  frames,
  selectedFrameId,
  onSelectFrame,
  autoScroll,
  onAutoScrollChange,
}: FrameLogProps) {
  const listRef = useRef<FixedSizeList | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [newFramesCount, setNewFramesCount] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);
  const prevFramesLength = useRef(frames.length);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight || 500);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    if (frames.length > prevFramesLength.current) {
      const diff = frames.length - prevFramesLength.current;
      if (autoScroll) {
        listRef.current?.scrollToItem(0, "smart");
      } else {
        setNewFramesCount((prev) => prev + diff);
      }
    }
    prevFramesLength.current = frames.length;
  }, [frames.length, autoScroll]);

  const handleScroll = useCallback(
    ({
      scrollOffset,
      scrollDirection,
    }: {
      scrollOffset: number;
      scrollDirection: "forward" | "backward";
    }) => {
      if (scrollDirection === "backward" || scrollOffset > 50) {
        if (autoScroll) onAutoScrollChange(false);
      } else if (scrollOffset < 20) {
        if (!autoScroll) {
          onAutoScrollChange(true);
          setNewFramesCount(0);
        }
      }
    },
    [autoScroll, onAutoScrollChange]
  );

  const scrollToNewest = () => {
    listRef.current?.scrollToItem(0, "smart");
    onAutoScrollChange(true);
    setNewFramesCount(0);
  };

  if (frames.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-lg p-8">
        <EmptyState
          icon={Radio}
          title="Ожидание кадров..."
          description="Трафик LCom не обнаружен или сниффер находится в режиме паузы/остановки."
        />
      </div>
    );
  }

  const renderRow = ({ index, style }: ListChildComponentProps) => {
    const frame = frames[index];
    return (
      <FrameRow
        frame={frame}
        isSelected={selectedFrameId === frame.id}
        onClick={() => onSelectFrame(frame.id)}
        style={style}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400 font-mono">
        <div className="flex items-center gap-4">
          <span>ВРЕМЯ (ISO)</span>
          <span>НАПР</span>
          <span>ПОРТ</span>
          <span>КОМАНДА</span>
          <span>ДАННЫЕ (HEX)</span>
        </div>
        <span>ВСЕГО: {frames.length}</span>
      </div>

      <div className="flex-1 relative">
        <FixedSizeList
          ref={listRef}
          height={Math.max(containerHeight - 32, 100)}
          itemCount={frames.length}
          itemSize={36}
          width="100%"
          onScroll={handleScroll}
        >
          {renderRow}
        </FixedSizeList>

        {!autoScroll && newFramesCount > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg gap-2 text-xs rounded-full px-4"
              onClick={scrollToNewest}
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              ↓ Новые кадры ({newFramesCount})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}'

apply_file "src/components/sniffer/FrameLog.tsx" "$EXPECTED_FRAMELOG" "react-window v1 FixedSizeList (агент перезаписывает под v2)"

# ============================================================
# 9. .gitignore
# ============================================================
log_hdr ".gitignore"

EXPECTED_GITIGNORE='node_modules/
.pnpm-store/
bun.lock
bun.lockb
package-lock.json
yarn.lock

dist/
build/
.vite/
.vite-temp/

.env
.env.local
.env.*.local

.vscode/*
!.vscode/extensions.json
.idea/
*.swp
*.swo

.DS_Store
Thumbs.db

*.log
npm-debug.log*
pnpm-debug.log*

__pycache__/
*.py[cod]
.venv/
venv/
*.egg-info/

firmware/**/.pio/
firmware/**/.pioenvs/
firmware/**/.piolibdeps/
firmware/**/build/

metadata.json
.fixup-backup/'

apply_file ".gitignore" "$EXPECTED_GITIGNORE" "расширение списка игнорируемых файлов"

# ============================================================
# 10. Мусор от AI Studio
# ============================================================
log_hdr "Очистка мусора"

for f in metadata.json bun.lock bun.lockb; do
  if [[ -f "$f" ]]; then
    log_fix "$f — удаляю (остаток от AI Studio)"
    if [[ $DRY_RUN -eq 0 ]]; then
      backup_file "$f"
      rm -f "$f"
    fi
  fi
done

# ============================================================
# Итог + verify
# ============================================================
echo
if [[ $FIXED_COUNT -eq 0 ]]; then
  echo "${C_OK}${C_BOLD}Все файлы уже в правильном состоянии.${C_RESET}"
else
  echo "${C_FIX}${C_BOLD}Исправлено файлов: $FIXED_COUNT${C_RESET}"
  [[ $DRY_RUN -eq 0 ]] && echo "Бэкап: $BACKUP_DIR"
fi

if [[ $DRY_RUN -eq 1 ]]; then
  echo
  echo "${C_DIM}Запусти без --dry-run чтобы применить.${C_RESET}"
  exit 0
fi

if [[ $VERIFY -eq 1 ]]; then
  log_hdr "Проверка"
  if ! command -v pnpm >/dev/null 2>&1; then
    log_err "pnpm не найден в PATH — пропускаю lint/build"
  else
    if ! pnpm install --frozen-lockfile=false >/dev/null 2>&1; then
      log_err "pnpm install упал"
      exit 1
    fi
    log_ok "pnpm install"

    if pnpm lint; then
      log_ok "pnpm lint"
    else
      log_err "pnpm lint не прошёл"
      exit 1
    fi

    if pnpm build >/dev/null 2>&1; then
      log_ok "pnpm build"
    else
      log_err "pnpm build не прошёл — запусти вручную для деталей"
      exit 1
    fi
  fi
fi

if [[ $COMMIT -eq 1 ]]; then
  log_hdr "Git commit"
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    log_err "не git-репозиторий"
  else
    if git diff --quiet && git diff --cached --quiet; then
      log_ok "нет изменений — коммит не нужен"
    else
      git add -A
      git commit -m "fix: reapply AI Studio fixes ($(date +%Y-%m-%d))"
      log_ok "коммит создан: $(git rev-parse --short HEAD)"
    fi
  fi
fi

echo
echo "${C_OK}${C_BOLD}Готово.${C_RESET}"
echo "${C_DIM}Если pnpm dev работает — перезапусти его.${C_RESET}"
