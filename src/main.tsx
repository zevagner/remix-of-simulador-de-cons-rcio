import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { logger } from '@/utils/logger';
import { initObservability } from '@/lib/observability';
import { initWebVitals } from '@/lib/webVitals';
import { initRuntimeObservers } from '@/lib/observers/runtimeObservers';
import { runWave1Sanitize } from '@/utils/storage/wave1Sanitize';
import { runWave2Sanitize } from '@/utils/storage/wave2Sanitize';
import { runWave3Sanitize } from '@/utils/storage/wave3Sanitize';

// Wave 1 — Legacy storage cleanup (idempotente, baixo risco).
runWave1Sanitize();
// Wave 2 — strategy-v2 definitive removal cleanup (idempotente).
runWave2Sanitize();
// Wave 3 — Analysis force-flag consolidation (idempotente).
// Remove `analysis:lastTab` / `analysis:force-default` / `analysis:force-overview`.
// Ownership canônico = `nav:lastSubmodule` (navState).
runWave3Sanitize();

// Sprint A — observabilidade opt-in via VITE_SENTRY_DSN; no-op se não configurada.
initObservability();
// Runtime Performance Wave — Web Vitals (FCP/LCP/CLS/INP/TTFB).
// Loga em dev/preview; em prod envia breadcrumbs ao Sentry quando DSN ativa.
initWebVitals();
// Wave 3 — Long tasks, memory sampler, device class.
initRuntimeObservers();

// Aggressively unregister any previously installed Service Workers and clear
// their caches. The PWA layer was removed because it intercepted Supabase auth
// requests and caused login timeouts (~15s) on the published domain.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => {});
}
if ("caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((k) => caches.delete(k));
  }).catch(() => {});
}

// Validação de regressão em DEV — falha visível no console se alguma regra crítica quebrar.
if (import.meta.env.DEV) {
  import("./utils/decisionEngine").then(({ validateSystem }) => {
    const report = validateSystem();
    if (report.ok) {
      // eslint-disable-next-line no-console
      logger.info(`[validateSystem] ✅ ${report.cases.length} cenários OK`);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
