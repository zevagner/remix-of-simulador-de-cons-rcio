/**
 * AI Response Cache — cache leve em memória (sessão) para evitar chamadas
 * repetidas a edges de IA quando o payload é idêntico.
 *
 * Casos de uso:
 *  - usuário gera, copia, troca de aba e volta → reutiliza
 *  - clica "regerar" sem mudar nada → reutiliza
 *  - mesmo lance/fase/script já consultados na sessão
 *
 * Não persiste em localStorage de propósito (storytellings premium têm seu
 * próprio cache TTL 7d em storytellingCache.ts). Aqui é apenas anti-burst.
 *
 * TTL padrão: 15 min. Tamanho máximo: 50 entradas (LRU simples).
 */

type Entry<T> = { value: T; at: number };

const STORE = new Map<string, Entry<unknown>>();
const DEFAULT_TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 50;

function stableStringify(input: unknown): string {
  if (input === null || typeof input !== 'object') return JSON.stringify(input);
  if (Array.isArray(input)) return '[' + input.map(stableStringify).join(',') + ']';
  const keys = Object.keys(input as Record<string, unknown>).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify((input as Record<string, unknown>)[k])).join(',') + '}';
}

/**
 * Onda 6 — convergência multi-tenant: o `tenantId` (companyId) é prefixado
 * em toda chave para garantir isolamento de cache entre empresas no mesmo
 * navegador/sessão. Quando indisponível, usa "anon" para não quebrar o
 * caminho público.
 */
export function cacheKey(scope: string, payload: unknown, tenantId?: string | null): string {
  const tenant = tenantId ?? 'anon';
  return tenant + '|' + scope + '::' + stableStringify(payload);
}

export function invalidateTenant(tenantId: string | null | undefined): void {
  const prefix = (tenantId ?? 'anon') + '|';
  for (const k of STORE.keys()) {
    if (k.startsWith(prefix)) STORE.delete(k);
  }
}

export function getCached<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  const entry = STORE.get(key) as Entry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.at > ttlMs) {
    STORE.delete(key);
    return null;
  }
  // LRU: refresh insertion order
  STORE.delete(key);
  STORE.set(key, entry);
  return entry.value;
}

export function setCached<T>(key: string, value: T): void {
  if (STORE.size >= MAX_ENTRIES) {
    const firstKey = STORE.keys().next().value;
    if (firstKey) STORE.delete(firstKey);
  }
  STORE.set(key, { value, at: Date.now() });
}

export function invalidateScope(scope: string): void {
  for (const k of STORE.keys()) {
    if (k.startsWith(scope + '::')) STORE.delete(k);
  }
}
