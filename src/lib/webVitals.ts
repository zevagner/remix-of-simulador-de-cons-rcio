/**
 * Web Vitals → Observability bridge.
 *
 * Captura FCP, LCP, CLS, INP, TTFB e envia para Sentry quando ativo;
 * em dev/preview, loga no console com prefixo `[web-vitals]`.
 *
 * Sem PII. Não cria entry de bundle pesado: `web-vitals` é ~2 KB gzip
 * e import direto evita waterfall.
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import * as Sentry from "@sentry/react";
import { emitMetric } from "./runtimeMetrics";

const RATING_LEVEL: Record<string, "info" | "warning" | "error"> = {
  good: "info",
  "needs-improvement": "warning",
  poor: "error",
};

function report(metric: Metric) {
  const level = RATING_LEVEL[metric.rating] ?? "info";
  // Pipeline central — alimenta Performance Intelligence Dashboard.
  emitMetric({
    type: "web-vital",
    name: metric.name,
    value: metric.value,
    rating: metric.rating as "good" | "needs-improvement" | "poor",
    meta: { navigationType: metric.navigationType },
  });
  // Sempre loga em dev/preview para visibilidade imediata.
  if (import.meta.env.DEV || import.meta.env.MODE !== "production") {
    // eslint-disable-next-line no-console
    console.info(
      `[web-vitals] ${metric.name} = ${metric.value.toFixed(1)} (${metric.rating})`,
    );
  }
  // Sentry só envia se DSN ativa (ver src/lib/observability.ts).
  try {
    Sentry.addBreadcrumb({
      category: "web-vitals",
      level,
      message: metric.name,
      data: {
        value: Math.round(metric.value),
        rating: metric.rating,
        navigationType: metric.navigationType,
      },
    });
    if (metric.rating === "poor") {
      Sentry.captureMessage(`web-vitals/${metric.name}=poor`, "warning");
    }
  } catch {
    /* no-op */
  }
}

let started = false;
export function initWebVitals() {
  if (started) return;
  started = true;
  onCLS(report);
  onFCP(report);
  onINP(report);
  onLCP(report);
  onTTFB(report);
}
