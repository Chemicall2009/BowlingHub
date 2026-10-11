import { http, HttpResponse, delay } from "msw";
import { MOCK_CAMERAS } from "../data/cameras";

export const cameraHandlers = [
  http.get("/api/cameras", async () => {
    await delay(100);
    return HttpResponse.json(MOCK_CAMERAS);
  }),

  http.post("/api/cameras/:cameraId/snapshot", async ({ params }) => {
    await delay(500);
    const cameraId = String(params.cameraId);
    return HttpResponse.json({ url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="black"/><text x="50%" y="50%" fill="white" text-anchor="middle">SNAPSHOT ${cameraId}</text></svg>` });
  }),
];
