/**
 * Runtime Metrics Store — pipeline central institucional.
 *
 * Centraliza eventos de performance (Web Vitals, render spikes, queries,
 * chunks, interactions). Buffer in-memory circular (cap 500) com pub/sub
 * para o Performance Intelligence Dashboard.
 *
 * PRINCÍPIO ABSOLUTO: zero overhead em produção sem subscribers.
 * - Sem timers, sem polling, sem persistência.
 * - O buffer só cresce quando algo realmente reporta.
 * - subscribe() é opt-in; o dashboard só monta sob demanda no Admin.
 *
 * Sem PII. Apenas métricas técnicas (nome, valor, rating, módulo, rota).
 */

export type RuntimeMetricType =
  | "web-vital"
  | "render"
  | "query"
  | "chunk"
  | "interaction"
  | "warning"
  | "long-task"
  | "memory"
  | "device"
  | "login-timing";

export type RuntimeRating = "good" | "needs-improvement" | "poor";

export type RuntimeMetricEvent = {
  type: RuntimeMetricType;
  name: string;
  value: number;
  rating?: RuntimeRating;
  module?: string;
  route?: string;
  timestamp: number;
  meta?: Record<string, string | number | boolean | undefined>;
};

const MAX_BUFFER = 500;
const buffer: RuntimeMetricEvent[] = [];
const listeners = new Set<(e: RuntimeMetricEvent) => void>();

export function emitMetric(event: Omit<RuntimeMetricEvent, "timestamp"> & { timestamp?: number }) {
  const enriched: RuntimeMetricEvent = {
    timestamp: Date.now(),
    route: typeof window !== "undefined" ? window.location?.pathname : undefined,
    ...event,
  };
  buffer.push(enriched);
  if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER);
  if (listeners.size === 0) return;
  for (const fn of listeners) {
    try {
      fn(enriched);
    } catch {
      /* no-op */
    }
  }
}

export function subscribeMetrics(fn: (e: RuntimeMetricEvent) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getMetricsSnapshot(): RuntimeMetricEvent[] {
  return buffer.slice();
}

export function clearMetrics() {
  buffer.length = 0;
}

/**
 * Web Vitals thresholds oficiais (web.dev/vitals).
 */
export const VITAL_THRESHOLDS: Record<string, { good: number; poor: number; unit: string }> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "" },
  FCP: { good: 1800, poor: 3000, unit: "ms" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
};

export function classifyVital(name: string, value: number): RuntimeRating {
  const t = VITAL_THRESHOLDS[name];
  if (!t) return "good";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}
