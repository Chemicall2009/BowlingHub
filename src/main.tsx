/**
 * @file src/main.tsx
 * @description Точка входа приложения с условной инициализацией MSW.
 */

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { worker } from "./mocks/browser";

async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_USE_MOCK_API === "false") return;
  try {
    await worker.start({
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
      onUnhandledRequest: "bypass",
      quiet: true,
    } as any);
    if (import.meta.env.DEV) {
      console.log("[MSW] Mock Service Worker started successfully.");
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[MSW] Failed to register service worker:", err);
    }
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
