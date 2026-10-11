import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

export async function enableMocking(): Promise<void> {
  // If in browser environment
  if (typeof window !== "undefined") {
    try {
      await worker.start({
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
        onUnhandledRequest: "bypass",
        quiet: true,
      });
      console.log("[MSW] Mock Service Worker started successfully.");
    } catch (err) {
      console.warn("[MSW] Failed to register service worker:", err);
    }
  }
}
