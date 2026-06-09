/**
 * Runtime Observers — Performance Wave 3 (Real User Observability).
 *
 * Coleta métricas REAIS de produção sem PII e com overhead mínimo:
 *  - Long Tasks (PerformanceObserver 'longtask' >50ms) → jank/freeze real
 *  - Memory sampling (performance.memory) → leaks e growth contínuo
 *  - Device class (deviceMemory, hardwareConcurrency, connection) → segmentação
 *  - Login timings (performance.mark/measure) → auth → app hydration
 *
 * PRINCÍPIOS:
 *  - Idempotente: chamar init múltiplas vezes é seguro
 *  - Best-effort: nunca quebra o app se uma API não existir
 *  - Sem polling agressivo: memória amostra a cada 30s e só durante visibility=visible
 *  - Sem PII: apenas números, classes e thresholds
 */
import { emitMetric } from "@/lib/runtimeMetrics";

let started = false;

type MemoryInfo = { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
type PerfWithMemory = Performance & { memory?: MemoryInfo };
type NavConnection = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};
type NavWithExtras = Navigator & {
  deviceMemory?: number;
  connection?: NavConnection;
};

function initLongTasks() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const dur = entry.duration;
        if (dur < 50) continue;
        emitMetric({
          type: "long-task",
          name: "longtask",
          value: dur,
          rating: dur > 200 ? "poor" : dur > 100 ? "needs-improvement" : "good",
          meta: { startTime: Math.round(entry.startTime) },
        });
      }
    });
    obs.observe({ type: "longtask", buffered: true });
  } catch {
    /* longtask não suportado (Safari) — silencioso */
  }
}

function initMemorySampler() {
  const perf = performance as PerfWithMemory;
  if (!perf?.memory) return; // Chromium-only
  let lastUsed = 0;
  const sample = () => {
    const m = perf.memory!;
    const usedMB = m.usedJSHeapSize / (1024 * 1024);
    const limitMB = m.jsHeapSizeLimit / (1024 * 1024);
    const pct = (m.usedJSHeapSize / m.jsHeapSizeLimit) * 100;
    const growth = lastUsed ? usedMB - lastUsed : 0;
    lastUsed = usedMB;
    emitMetric({
      type: "memory",
      name: "heap",
      value: usedMB,
      rating: pct > 80 ? "poor" : pct > 60 ? "needs-improvement" : "good",
      meta: {
        usedMB: Math.round(usedMB),
        limitMB: Math.round(limitMB),
        pct: Math.round(pct),
        growthMB: Number(growth.toFixed(1)),
      },
    });
  };

  // ─── Onda 4 (Long-task Observer Hygiene) ───
  // Pausa o sampler quando a aba está oculta. Antes: setInterval acordava o
  // event loop a cada 30s mesmo em background tab (apenas pulava a emissão).
  // Depois: o timer só existe enquanto `visibilityState === 'visible'`. Em
  // SPA longa com várias abas, isso elimina wake-ups silenciosos contínuos.
  let intervalId: ReturnType<typeof setInterval> | null = null;
  const isVisible = () =>
    typeof document === "undefined" || document.visibilityState === "visible";

  const start = () => {
    if (intervalId !== null) return;
    intervalId = setInterval(sample, 30000);
  };
  const stop = () => {
    if (intervalId === null) return;
    clearInterval(intervalId);
    intervalId = null;
  };

  // Primeira amostra após 5s (deixa boot acalmar).
  setTimeout(() => {
    if (isVisible()) sample();
    if (isVisible()) start();
  }, 5000);

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (isVisible()) start();
      else stop();
    });
  }
}

function emitDeviceClass() {
  const nav = navigator as NavWithExtras;
  const memory = nav.deviceMemory ?? 0;
  const cores = nav.hardwareConcurrency ?? 0;
  const conn = nav.connection;
  const ua = navigator.userAgent || "";
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  // Classe heurística institucional: low (corp/notebook fraco), mid, high
  let deviceClass: "low" | "mid" | "high" = "mid";
  if (memory && cores) {
    if (memory <= 2 || cores <= 2) deviceClass = "low";
    else if (memory >= 8 && cores >= 8) deviceClass = "high";
  }
  emitMetric({
    type: "device",
    name: "device-class",
    value: cores,
    rating: deviceClass === "low" ? "needs-improvement" : "good",
    meta: {
      deviceClass,
      isMobile,
      deviceMemoryGB: memory || undefined,
      cores: cores || undefined,
      effectiveType: conn?.effectiveType,
      downlinkMbps: conn?.downlink,
      rttMs: conn?.rtt,
      saveData: conn?.saveData,
      dpr: window.devicePixelRatio,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    },
  });
}

export function initRuntimeObservers() {
  if (started) return;
  started = true;
  // Marca de boot da app shell — ponto de referência para measures futuras.
  try {
    performance.mark("app:boot");
  } catch {
    /* noop */
  }
  initLongTasks();
  initMemorySampler();
  // Device class após idle para não competir com first paint.
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(emitDeviceClass);
  else setTimeout(emitDeviceClass, 1500);
}

/**
 * Login → App timings.
 * Use markLoginStart no submit, markLoginSuccess no auth ok,
 * markAppShellReady quando o Index montou. measureLoginFlow consolida.
 */
export function markLoginStart() {
  try {
    performance.mark("login:start");
  } catch {
    /* noop */
  }
}

export function markLoginSuccess() {
  try {
    performance.mark("login:success");
    const entries = performance.getEntriesByName("login:start");
    if (entries.length) {
      const m = performance.measure("login:auth", "login:start", "login:success");
      emitMetric({
        type: "login-timing",
        name: "auth",
        value: m.duration,
        rating: m.duration > 3000 ? "poor" : m.duration > 1500 ? "needs-improvement" : "good",
      });
    }
  } catch {
    /* noop */
  }
}

export function markAppShellReady() {
  try {
    performance.mark("app:shell-ready");
    const success = performance.getEntriesByName("login:success");
    if (success.length) {
      const m = performance.measure("login:hydration", "login:success", "app:shell-ready");
      emitMetric({
        type: "login-timing",
        name: "hydration",
        value: m.duration,
        rating: m.duration > 1500 ? "poor" : m.duration > 800 ? "needs-improvement" : "good",
      });
      const total = performance.measure("login:total", "login:start", "app:shell-ready");
      emitMetric({
        type: "login-timing",
        name: "total",
        value: total.duration,
        rating: total.duration > 4000 ? "poor" : total.duration > 2500 ? "needs-improvement" : "good",
      });
    }
  } catch {
    /* noop */
  }
}
