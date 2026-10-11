/**
 * @file src/App.tsx
 * @description Корневой компонент с React.lazy code-splitting, Error Boundary и провайдерами шины событий.
 */

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { WebSocketProvider } from "./providers/WebSocketProvider";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./pages/NotFound";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { useConnectionEvents, useErrorEvents } from "./ws/hooks";

const LaneDetail = lazy(() => import("./pages/LaneDetail").then((m) => ({ default: m.LaneDetail })));
const Calibration = lazy(() => import("./pages/Calibration").then((m) => ({ default: m.Calibration })));
const Emulator = lazy(() => import("./pages/Emulator").then((m) => ({ default: m.Emulator })));
const Sniffer = lazy(() => import("./pages/Sniffer").then((m) => ({ default: m.Sniffer })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const Logs = lazy(() => import("./pages/Logs").then((m) => ({ default: m.Logs })));

function GlobalEventHooksLoader() {
  useConnectionEvents();
  useErrorEvents();
  return null;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-400 text-xs">
      Загрузка модуля...
    </div>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <WebSocketProvider>
          <GlobalEventHooksLoader />
          <BrowserRouter>
            <ErrorBoundary fallbackTitle="Критическая ошибка приложения">
              <Routes>
                <Route path="/" element={<AppShell />}>
                  <Route
                    index
                    element={
                      <ErrorBoundary fallbackTitle="Ошибка на Дашборде">
                        <Dashboard />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="lane/:id"
                    element={
                      <ErrorBoundary fallbackTitle="Ошибка панели дорожки">
                        <Suspense fallback={<PageLoader />}>
                          <LaneDetail />
                        </Suspense>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="calibration"
                    element={
                      <ErrorBoundary fallbackTitle="Ошибка модуля калибровки">
                        <Suspense fallback={<PageLoader />}>
                          <Calibration />
                        </Suspense>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="emulator"
                    element={
                      <ErrorBoundary fallbackTitle="Ошибка эмулятора команд">
                        <Suspense fallback={<PageLoader />}>
                          <Emulator />
                        </Suspense>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="sniffer"
                    element={
                      <ErrorBoundary fallbackTitle="Ошибка сниффера шины">
                        <Suspense fallback={<PageLoader />}>
                          <Sniffer />
                        </Suspense>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <ErrorBoundary fallbackTitle="Ошибка настроек">
                        <Suspense fallback={<PageLoader />}>
                          <Settings />
                        </Suspense>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="logs"
                    element={
                      <ErrorBoundary fallbackTitle="Ошибка журнала логов">
                        <Suspense fallback={<PageLoader />}>
                          <Logs />
                        </Suspense>
                      </ErrorBoundary>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
          <Toaster position="top-right" closeButton richColors />
        </WebSocketProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
