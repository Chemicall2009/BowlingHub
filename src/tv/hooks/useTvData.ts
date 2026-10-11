/**
 * @file src/tv/hooks/useTvData.ts
 * @description Hook polling /lanes/:id and /games/:id to build TvSnapshot for TV display.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../api/client";
import type { Lane, Game } from "../../api/types";
import type { TvSnapshot, TvGame, TvPlayer, TvFrame } from "../types";

export function useTvData(laneId: number) {
  const laneQ = useQuery({
    queryKey: ["tv", "lane", laneId],
    queryFn: () => apiGet<Lane>(`/lanes/${laneId}`),
    refetchInterval: 500,
    refetchIntervalInBackground: true,
  });

  const gameId = laneQ.data?.current_game?.id;
  const gameQ = useQuery({
    queryKey: ["tv", "game", gameId],
    queryFn: () => apiGet<Game>(`/games/${gameId}`),
    enabled: !!gameId,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  const snapshot: TvSnapshot | null = useMemo(() => {
    if (!laneQ.data) return null;
    const lane = laneQ.data;
    const game = gameQ.data;

    let tvGame: TvGame | null = null;
    if (game) {
      const players: TvPlayer[] = game.players.map((p, pIdx) => ({
        name: p.name,
        order_index: pIdx,
        is_current: p.id === game.players[game.current_player_index]?.id,
        total: p.total_score,
        frames: p.frames.map((f) => {
          const rollsNum = f.rolls.map((r) => (typeof r === "number" ? r : r === "X" ? 10 : r === "/" ? 5 : r === "F" ? 0 : null));
          const isStrike = f.rolls.includes("X");
          const isSpare = f.rolls.includes("/");
          return {
            frame: f.frame,
            rolls: rollsNum,
            cumulative: f.score,
            is_strike: isStrike,
            is_spare: isSpare,
          };
        }),
      }));

      const currentPlayer = game.players[game.current_player_index];

      tvGame = {
        player_name: currentPlayer?.name || "Игрок 1",
        frame: game.current_frame || 1,
        shot_in_frame: 1,
        score: currentPlayer?.total_score || 0,
        players,
      };
    } else if (lane.current_game) {
      tvGame = {
        player_name: lane.current_game.player_name,
        frame: lane.current_game.current_frame || 1,
        shot_in_frame: 1,
        score: lane.current_game.score || 0,
        players: [
          {
            name: lane.current_game.player_name,
            order_index: 0,
            is_current: true,
            total: lane.current_game.score || 0,
            frames: [],
          },
        ],
      };
    }

    return {
      type: "tv.snapshot",
      lane_id: lane.id,
      lane_display: lane.name || `Дорожка ${lane.number}`,
      lane_status: lane.status,
      current_game: tvGame,
      pins: lane.pins || Array(10).fill(true),
      foul1: lane.foul1 || false,
      foul2: lane.foul2 || false,
      split: lane.split || false,
      speed_kmh: lane.speed || null,
      options: lane.options || {
        bambini: false,
        cosmic: false,
        kbd_lock: false,
        no_speed: false,
        swap_off: false,
      },
      baud: 9600,
      timestamp: new Date().toISOString(),
    };
  }, [laneQ.data, gameQ.data]);

  return {
    snapshot,
    isLoading: laneQ.isLoading,
    isError: laneQ.isError,
  };
}
