/**
 * Consent Store — Onda LGPD Fase 2.
 *
 * Modelo simples: o produto é privado (login obrigatório), então não precisamos
 * de um banner regulatório pesado. Mas analytics/observability são tratamentos
 * de dados além do estritamente necessário para o serviço — portanto exigem
 * consentimento explícito.
 *
 * Estados possíveis:
 *  - "unknown"   → ainda não decidiu (default; analytics OFF)
 *  - "granted"   → optou por permitir
 *  - "denied"    → optou por bloquear
 *
 * Persistido em localStorage com versão para permitir invalidação futura.
 */
const STORAGE_KEY = "lgpd.consent.v1";

export type ConsentStatus = "unknown" | "granted" | "denied";

export interface ConsentState {
  analytics: ConsentStatus;
  decidedAt: string | null;
}

const DEFAULT: ConsentState = { analytics: "unknown", decidedAt: null };

type Listener = (s: ConsentState) => void;
const listeners = new Set<Listener>();

function read(): ConsentState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      analytics: parsed.analytics === "granted" || parsed.analytics === "denied" ? parsed.analytics : "unknown",
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : null,
    };
  } catch {
    return DEFAULT;
  }
}

function write(state: ConsentState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* noop */ }
  listeners.forEach((fn) => { try { fn(state); } catch { /* noop */ } });
}

export function getConsent(): ConsentState {
  return read();
}

export function isAnalyticsAllowed(): boolean {
  return read().analytics === "granted";
}

export function setAnalyticsConsent(granted: boolean): void {
  write({ analytics: granted ? "granted" : "denied", decidedAt: new Date().toISOString() });
}

export function revokeAnalyticsConsent(): void {
  write({ analytics: "denied", decidedAt: new Date().toISOString() });
}

export function subscribeConsent(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
