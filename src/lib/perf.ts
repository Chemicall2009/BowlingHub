/**
 * @file src/lib/perf.ts
 * @description Утилиты измерения производительности рендеринга (работает только в DEV окружении).
 */

export function measureRenderStart(componentName: string): number {
  if (import.meta.env.DEV) {
    return performance.now();
  }
  return 0;
}

export function measureRenderEnd(componentName: string, startTime: number): void {
  if (import.meta.env.DEV && startTime > 0) {
    const duration = performance.now() - startTime;
    if (duration > 16) {
      console.warn(`[Perf] Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  }
}
