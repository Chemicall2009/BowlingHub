/**
 * @file src/mocks/handlers/calibration.ts
 * @description MSW v2 обработчики эндпоинтов калибровки камер (/api/calibration/*).
 */

import { http, HttpResponse, delay } from "msw";
import type {
  CalibrationProfile,
  CalibrationTestResult,
  CreateProfileDto,
  UpdateProfileDto,
  Point,
} from "../../api/calibration";
import type { ProblemDetails } from "./lanes";

/**
 * Генерирует дефолтное SVG-изображение пиндека в формате data URL
 */
export function generateMockPinDeckSvg(laneNumber: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="laneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b18" />
      <stop offset="30%" stop-color="#2a241e" />
      <stop offset="100%" stop-color="#141210" />
    </linearGradient>
    <linearGradient id="deckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3d352e" />
      <stop offset="100%" stop-color="#211c18" />
    </linearGradient>
  </defs>
  <!-- Background & Lane perspective -->
  <rect width="640" height="480" fill="#09090b"/>
  <polygon points="120,480 520,480 430,90 210,90" fill="url(#laneGrad)" stroke="#453b31" stroke-width="2"/>
  
  <!-- Gutters -->
  <polygon points="60,480 120,480 210,90 180,90" fill="#18181b"/>
  <polygon points="520,480 580,480 460,90 430,90" fill="#18181b"/>

  <!-- Pin deck area -->
  <polygon points="180,240 460,240 430,90 210,90" fill="url(#deckGrad)" opacity="0.9"/>

  <!-- Grid perspective lines -->
  <line x1="210" y1="90" x2="120" y2="480" stroke="#524436" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="265" y1="90" x2="220" y2="480" stroke="#524436" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="320" y1="90" x2="320" y2="480" stroke="#715c48" stroke-width="1.5"/>
  <line x1="375" y1="90" x2="420" y2="480" stroke="#524436" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="430" y1="90" x2="520" y2="480" stroke="#524436" stroke-width="1" stroke-dasharray="4,4"/>

  <!-- Pin deck spot markers (triangular spots) -->
  <circle cx="320" cy="140" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="280" cy="180" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="360" cy="180" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="240" cy="220" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="320" cy="220" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="400" cy="220" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="200" cy="260" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="280" cy="260" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="360" cy="260" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="440" cy="260" r="14" fill="#27272a" stroke="#fbbf24" stroke-width="2"/>

  <!-- Info Header Overlay -->
  <rect x="20" y="20" width="300" height="38" rx="6" fill="#000000" fill-opacity="0.75" stroke="#27272a"/>
  <text x="32" y="44" fill="#10b981" font-family="monospace" font-size="13" font-weight="bold">
    CAM-FEED • LANE #${laneNumber} • 640x480 RAW
  </text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Создаёт тестовую SVG-картинку с наложением разметки
 */
function generateDebugOverlaySvg(
  pins: Point[],
  roi: Point[],
  detected: boolean[],
  confidence: number
): string {
  const roiPath = roi.length === 4
    ? `M ${roi[0].x} ${roi[0].y} L ${roi[1].x} ${roi[1].y} L ${roi[2].x} ${roi[2].y} L ${roi[3].x} ${roi[3].y} Z`
    : "";

  const circles = pins
    .map((p, i) => {
      const isStanding = detected[i] ?? true;
      const fill = isStanding ? "#10b981" : "#ef4444";
      const stroke = isStanding ? "#34d399" : "#f87171";
      return `
        <circle cx="${p.x}" cy="${p.y}" r="12" fill="${fill}" fill-opacity="0.8" stroke="${stroke}" stroke-width="3" />
        <text x="${p.x}" y="${p.y + 4}" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${i + 1}</text>
      `;
    })
    .join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <rect width="640" height="480" fill="#09090b"/>
  <!-- ROI polygon -->
  ${roiPath ? `<path d="${roiPath}" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="2" stroke-dasharray="4,4"/>` : ""}
  
  <!-- Pin circles -->
  ${circles}

  <!-- Diagnostic hud badge -->
  <rect x="20" y="20" width="340" height="48" rx="8" fill="#18181b" stroke="#27272a"/>
  <text x="32" y="42" fill="#34d399" font-family="monospace" font-size="12" font-weight="bold">
    AI PIN DETECTION: CONFIDENCE ${(confidence * 100).toFixed(1)}%
  </text>
  <text x="32" y="58" fill="#a1a1aa" font-family="monospace" font-size="10">
    PINS DOWN: ${detected.filter((d) => !d).length} / 10 • STATUS: OK
  </text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Стандартные координаты 10 кеглей для кадра 640x480
const DEFAULT_PINS_640x480: Point[] = [
  { x: 320, y: 140 }, // Кегля 1 (вершина)
  { x: 280, y: 180 }, // Кегли 2, 3
  { x: 360, y: 180 },
  { x: 240, y: 220 }, // Кегли 4, 5, 6
  { x: 320, y: 220 },
  { x: 400, y: 220 },
  { x: 200, y: 260 }, // Кегли 7, 8, 9, 10
  { x: 280, y: 260 },
  { x: 360, y: 260 },
  { x: 440, y: 260 },
];

const DEFAULT_ROI_640x480: Point[] = [
  { x: 180, y: 110 },
  { x: 460, y: 110 },
  { x: 500, y: 300 },
  { x: 140, y: 300 },
];

// In-memory store профилей
export const calibrationProfilesStore = new Map<string, CalibrationProfile>([
  [
    "prof-lane-6",
    {
      id: "prof-lane-6",
      lane_id: 6,
      camera_id: "tvision-1",
      camera_type: "tvision",
      polygon_roi: [...DEFAULT_ROI_640x480],
      pin_positions: [...DEFAULT_PINS_640x480],
      reference_frame_url: generateMockPinDeckSvg(6),
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      notes: "T-Vision 2.4м, откалибрована после замены ламп освещения",
    },
  ],
  [
    "prof-lane-8",
    {
      id: "prof-lane-8",
      lane_id: 8,
      camera_id: "pin-deck-1",
      camera_type: "pin_deck",
      polygon_roi: [...DEFAULT_ROI_640x480],
      pin_positions: [...DEFAULT_PINS_640x480],
      reference_frame_url: generateMockPinDeckSvg(8),
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
      notes: "Штатная камера Pin Deck, смещение по оси Y компенсировано",
    },
  ],
]);

export const calibrationHandlers = [
  // GET /api/calibration/profiles
  http.get("/api/calibration/profiles", async ({ request }) => {
    await delay(120);
    const url = new URL(request.url);
    const laneIdParam = url.searchParams.get("lane_id");

    let list = Array.from(calibrationProfilesStore.values());
    if (laneIdParam) {
      const laneId = Number(laneIdParam);
      list = list.filter((p) => p.lane_id === laneId);
    }

    // Сортировка: сначала активные, затем новые
    list.sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0));
    return HttpResponse.json(list);
  }),

  // GET /api/calibration/profiles/:id
  http.get("/api/calibration/profiles/:id", async ({ params }) => {
    await delay(80);
    const id = String(params.id);
    const profile = calibrationProfilesStore.get(id);

    if (!profile) {
      const error: ProblemDetails = {
        type: "https://bowland.club/errors/not-found",
        title: "Профиль калибровки не найден",
        status: 404,
        detail: `Профиль ${id} не существует`,
        instance: `/api/calibration/profiles/${id}`,
      };
      return HttpResponse.json(error, { status: 404 });
    }

    return HttpResponse.json(profile);
  }),

  // POST /api/calibration/profiles
  http.post("/api/calibration/profiles", async ({ request }) => {
    await delay(150);
    const body = (await request.json().catch(() => ({}))) as CreateProfileDto & {
      reference_frame_url?: string;
    };

    const newId = `prof-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newProfile: CalibrationProfile = {
      id: newId,
      lane_id: Number(body.lane_id) || 1,
      camera_type: body.camera_type || "tvision",
      polygon_roi: body.polygon_roi?.length === 4 ? body.polygon_roi : [...DEFAULT_ROI_640x480],
      pin_positions:
        body.pin_positions?.length === 10
          ? body.pin_positions
          : [...DEFAULT_PINS_640x480],
      reference_frame_url:
        body.reference_frame_url || generateMockPinDeckSvg(Number(body.lane_id) || 1),
      is_active: Boolean(body.is_active),
      created_at: now,
      updated_at: now,
      notes: body.notes ?? null,
    };

    // Если новый профиль активен — снимаем активность с других профилей этой дорожки
    if (newProfile.is_active) {
      for (const [, p] of calibrationProfilesStore) {
        if (p.lane_id === newProfile.lane_id) {
          p.is_active = false;
        }
      }
    }

    calibrationProfilesStore.set(newId, newProfile);
    return HttpResponse.json(newProfile, { status: 201 });
  }),

  // PUT /api/calibration/profiles/:id
  http.put("/api/calibration/profiles/:id", async ({ params, request }) => {
    await delay(120);
    const id = String(params.id);
    const existing = calibrationProfilesStore.get(id);

    if (!existing) {
      return HttpResponse.json(
        {
          type: "https://bowland.club/errors/not-found",
          title: "Профиль не найден",
          status: 404,
          detail: `Профиль ${id} не найден`,
        },
        { status: 404 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as UpdateProfileDto;
    const updated: CalibrationProfile = {
      ...existing,
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (updated.is_active) {
      for (const [, p] of calibrationProfilesStore) {
        if (p.id !== id && p.lane_id === updated.lane_id) {
          p.is_active = false;
        }
      }
    }

    calibrationProfilesStore.set(id, updated);
    return HttpResponse.json(updated);
  }),

  // DELETE /api/calibration/profiles/:id
  http.delete("/api/calibration/profiles/:id", async ({ params }) => {
    await delay(100);
    const id = String(params.id);
    if (!calibrationProfilesStore.has(id)) {
      return HttpResponse.json(
        {
          type: "https://bowland.club/errors/not-found",
          title: "Профиль не найден",
          status: 404,
          detail: `Профиль ${id} не найден`,
        },
        { status: 404 }
      );
    }

    calibrationProfilesStore.delete(id);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/calibration/profiles/:id/activate
  http.post("/api/calibration/profiles/:id/activate", async ({ params }) => {
    await delay(100);
    const id = String(params.id);
    const profile = calibrationProfilesStore.get(id);

    if (!profile) {
      return HttpResponse.json(
        {
          type: "https://bowland.club/errors/not-found",
          title: "Профиль не найден",
          status: 404,
          detail: `Профиль ${id} не найден`,
        },
        { status: 404 }
      );
    }

    // Снимаем активность с остальных профилей этой дорожки
    for (const [, p] of calibrationProfilesStore) {
      if (p.lane_id === profile.lane_id) {
        p.is_active = false;
      }
    }
    profile.is_active = true;
    profile.updated_at = new Date().toISOString();
    calibrationProfilesStore.set(id, profile);

    return HttpResponse.json(profile);
  }),

  // POST /api/calibration/:laneId/snapshot (multipart upload)
  http.post("/api/calibration/:laneId/snapshot", async ({ params, request }) => {
    await delay(250);
    const laneId = Number(params.laneId) || 1;

    // Читаем multipart form data
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      if (file && file instanceof File) {
        // Создаём локальный URL объекта
        const url = URL.createObjectURL(file);
        return HttpResponse.json({ url });
      }
    } catch {
      // Игнорируем и возвращаем дефолтный SVG
    }

    const mockUrl = generateMockPinDeckSvg(laneId);
    return HttpResponse.json({ url: mockUrl });
  }),

  // POST /api/calibration/profiles/:id/test
  http.post("/api/calibration/profiles/:id/test", async ({ params }) => {
    await delay(350);
    const id = String(params.id);
    const profile = calibrationProfilesStore.get(id);

    const pinPositions = profile?.pin_positions || DEFAULT_PINS_640x480;
    const polygonRoi = profile?.polygon_roi || DEFAULT_ROI_640x480;

    // Генерируем правдоподобный результат: 8-10 сбито (true = стоит, false = сбита)
    // Вероятность кегли остаться стоять ~ 15%
    const detectedPins = Array.from({ length: 10 }, () => Math.random() < 0.2);
    // Убедимся, что хотя бы 1-2 кегли стоят или сбиты реалистично
    const confidence = parseFloat((0.72 + Math.random() * 0.25).toFixed(2));

    const debugOverlayUrl = generateDebugOverlaySvg(
      pinPositions,
      polygonRoi,
      detectedPins,
      confidence
    );

    const testResult: CalibrationTestResult = {
      detected_pins: detectedPins,
      confidence,
      debug_overlay_url: debugOverlayUrl,
      raw_pin_state: {
        pins: detectedPins,
        foul1: false,
        foul2: false,
        split: detectedPins.filter(Boolean).length === 2 && detectedPins[6] && detectedPins[9],
        speed: parseFloat((23.5 + Math.random() * 4).toFixed(1)),
      },
    };

    return HttpResponse.json(testResult);
  }),
];
