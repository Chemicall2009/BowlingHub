/**
 * @file src/mocks/handlers/emulation.ts
 * @description MSW v2 обработчики эндпоинтов управления симуляцией (/api/emulation).
 */

import { http, HttpResponse, delay } from "msw";
import { simulationManager } from "../simulation/simulationManager";
import type { SimConfig } from "../simulation/types";

async function randomNetworkDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * 80) + 40;
  await delay(ms);
}

export const emulationHandlers = [
  // GET /api/emulation/status
  http.get("/api/emulation/status", async () => {
    await randomNetworkDelay();
    return HttpResponse.json({
      active_lanes: simulationManager.getActiveLanes(),
      config: simulationManager.getConfig(),
    });
  }),

  // POST /api/emulation/start
  http.post("/api/emulation/start", async ({ request }) => {
    await randomNetworkDelay();
    const body = (await request.json().catch(() => ({}))) as { lane_ids?: number[] };
    const laneIds = body.lane_ids && body.lane_ids.length > 0 ? body.lane_ids : undefined;
    simulationManager.startAll(laneIds);
    return HttpResponse.json({
      started: laneIds || Array.from({ length: 12 }, (_, i) => i + 1),
    });
  }),

  // POST /api/emulation/stop
  http.post("/api/emulation/stop", async ({ request }) => {
    await randomNetworkDelay();
    const body = (await request.json().catch(() => ({}))) as { lane_ids?: number[] };
    const laneIds = body.lane_ids && body.lane_ids.length > 0 ? body.lane_ids : undefined;
    simulationManager.stopAll(laneIds);
    return HttpResponse.json({
      stopped: laneIds || Array.from({ length: 12 }, (_, i) => i + 1),
    });
  }),

  // POST /api/emulation/pause
  http.post("/api/emulation/pause", async ({ request }) => {
    await randomNetworkDelay();
    const body = (await request.json().catch(() => ({}))) as { lane_ids?: number[] };
    const laneIds = body.lane_ids && body.lane_ids.length > 0 ? body.lane_ids : undefined;
    simulationManager.pauseAll(laneIds);
    return HttpResponse.json({
      paused: laneIds || Array.from({ length: 12 }, (_, i) => i + 1),
    });
  }),

  // POST /api/emulation/resume
  http.post("/api/emulation/resume", async ({ request }) => {
    await randomNetworkDelay();
    const body = (await request.json().catch(() => ({}))) as { lane_ids?: number[] };
    const laneIds = body.lane_ids && body.lane_ids.length > 0 ? body.lane_ids : undefined;
    simulationManager.resumeAll(laneIds);
    return HttpResponse.json({
      resumed: laneIds || Array.from({ length: 12 }, (_, i) => i + 1),
    });
  }),

  // POST /api/emulation/throw
  http.post("/api/emulation/throw", async ({ request }) => {
    await randomNetworkDelay();
    const body = (await request.json().catch(() => ({}))) as { lane_id?: number };
    const laneId = body.lane_id || 1;
    simulationManager.throwNow(laneId);
    return HttpResponse.json({
      thrown: true,
      lane_id: laneId,
      timestamp: new Date().toISOString(),
    });
  }),

  // POST /api/emulation/reset
  http.post("/api/emulation/reset", async ({ request }) => {
    await randomNetworkDelay();
    const body = (await request.json().catch(() => ({}))) as { lane_ids?: number[] };
    const targets = body.lane_ids && body.lane_ids.length > 0 ? body.lane_ids : Array.from({ length: 12 }, (_, i) => i + 1);
    targets.forEach((id) => simulationManager.resetLane(id));
    return HttpResponse.json({ reset: targets });
  }),

  // GET /api/emulation/config
  http.get("/api/emulation/config", async () => {
    await randomNetworkDelay();
    return HttpResponse.json(simulationManager.getConfig());
  }),

  // PUT /api/emulation/config
  http.put("/api/emulation/config", async ({ request }) => {
    await randomNetworkDelay();
    const body = (await request.json().catch(() => ({}))) as Partial<SimConfig>;
    const updated = simulationManager.setConfig(body);
    return HttpResponse.json(updated);
  }),
];
