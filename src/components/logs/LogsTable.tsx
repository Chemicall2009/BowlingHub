/**
 * @file src/components/logs/LogsTable.tsx
 * @description Универсальная таблица логов с пагинацией, колонками под источники и детальным инспектором.
 */

import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import type { LogSource, LogPage } from "../../api/logs";
import { formatTimestamp } from "../../lib/format";
import { FrameInspector } from "../sniffer/FrameInspector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";

interface LogsTableProps {
  source: LogSource;
  data?: LogPage<any>;
  isLoading: boolean;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export function LogsTable({
  source,
  data,
  isLoading,
  limit,
  offset,
  onPageChange,
  onLimitChange,
}: LogsTableProps) {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const items = data?.items || [];
  const total = data?.total || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-[400px]">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="px-4 py-2.5">ВРЕМЯ (ISO)</th>
              {source !== "errors" && <th className="px-4 py-2.5">НАПР</th>}
              <th className="px-4 py-2.5">ДОРОЖКА</th>
              <th className="px-4 py-2.5">КОМАНДА / СОБЫТИЕ</th>
              {source === "commands" && <th className="px-4 py-2.5">DRY RUN</th>}
              <th className="px-4 py-2.5">ДАННЫЕ / HEX</th>
              <th className="px-4 py-2.5 text-right">СТАТУС / CRC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  Загрузка логов...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  Записи не найдены по заданным фильтрам
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const isRx = item.direction === "rx";
                const hasErr = item.checksum_ok === false || item.error_code || item.parse_error;

                const frameShape = {
                  id: item.id || `item_${idx}`,
                  direction: item.direction || "rx",
                  timestamp: item.timestamp,
                  raw_hex: item.raw_hex || "02 01 55 55 55 55",
                  parsed: {
                    cmd: item.cmd || 2,
                    cmdName: item.cmd_name || "POLL_STATUS",
                    laneId: item.lane_id || 1,
                    payload: new Uint8Array([85, 85]),
                    checksum: 164,
                    checksumOk: !hasErr,
                    raw: new Uint8Array([2, 1, 164]),
                  },
                  parse_error: item.error_code ? `${item.error_code}: ${item.message}` : null,
                  baud: 9600,
                };

                return (
                  <tr
                    key={item.id || idx}
                    onClick={() => setSelectedItem(frameShape)}
                    className="hover:bg-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-zinc-400 whitespace-nowrap">
                      {formatTimestamp(item.timestamp)}
                    </td>
                    {source !== "errors" && (
                      <td className="px-4 py-2.5">
                        {item.direction ? (
                          isRx ? (
                            <span title="RX">
                              <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                            </span>
                          ) : (
                            <span title="TX">
                              <ArrowUpRight className="h-4 w-4 text-blue-400" />
                            </span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5 font-semibold text-white">
                      {item.lane_id ? `#${item.lane_id}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-blue-400 font-sans font-medium">
                      {item.cmd_name || item.error_code || "UNKNOWN"}
                    </td>
                    {source === "commands" && (
                      <td className="px-4 py-2.5 text-zinc-400">
                        {item.dry_run ? <span className="text-amber-400">Да</span> : "Нет"}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-zinc-300 truncate max-w-xs">
                      {item.raw_hex || item.message || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {hasErr ? (
                        <span className="inline-flex items-center gap-1 text-red-400">
                          <AlertTriangle className="h-3.5 w-3.5" /> Сбой
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-zinc-950 border-t border-zinc-800 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <span>Строк на странице:</span>
          <Select
            value={limit.toString()}
            onValueChange={(val) => onLimitChange(parseInt(val, 10))}
          >
            <SelectTrigger className="h-7 w-16 bg-zinc-900 border-zinc-800 text-zinc-200 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>Показано {Math.min(offset + 1, total)}–{Math.min(offset + limit, total)} из {total}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
            className="h-7 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Назад
          </Button>
          <span className="text-zinc-400">
            Страница {currentPage} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= total}
            onClick={() => onPageChange(offset + limit)}
            className="h-7 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs gap-1"
          >
            Вперед <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <FrameInspector frame={selectedItem} onClose={() => setSelectedItem(null)} />
        </div>
      )}
    </div>
  );
}
