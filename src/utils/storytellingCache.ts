/**
 * Storytelling Cache — persistência leve em localStorage para reaproveitar
 * conteúdo de IA já gerado nos módulos (Investimento, Nichos) ao montar
 * a Proposta Premium.
 *
 * - Chave por usuário (anon como fallback) e por "slot" (ex.: scenario:bid_15).
 * - TTL: 7 dias (depois disso, expira e força regeneração).
 * - Não substitui chamada à edge — quem consome decide se usa o cache ou
 *   refaz a chamada (estratégia "híbrida").
 */

const KEY_PREFIX = 'storytelling-cache:';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export type StorytellingSlot =
  | { kind: 'investment'; scenarioId: string }
  | { kind: 'niche'; nicheId: string }
  | { kind: 'argument'; topic: string };

export interface CachedStorytelling {
  text: string;
  /** Rótulo curto para exibição no wizard (ex.: "Cenário Lance 25%"). */
  label?: string;
  /** ISO timestamp de geração. */
  at: string;
  /** Origem (debug). */
  source?: string;
}

function bucketKey(userId: string | null): string {
  return `${KEY_PREFIX}${userId ?? 'anon'}`;
}

function readBucket(userId: string | null): Record<string, CachedStorytelling> {
  try {
    const raw = localStorage.getItem(bucketKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeBucket(userId: string | null, data: Record<string, CachedStorytelling>) {
  try {
    localStorage.setItem(bucketKey(userId), JSON.stringify(data));
  } catch {
    /* quota / privacy mode — silencioso */
  }
}

function slotKey(slot: StorytellingSlot): string {
  switch (slot.kind) {
    case 'investment': return `inv:${slot.scenarioId}`;
    case 'niche':      return `niche:${slot.nicheId}`;
    case 'argument':   return `arg:${slot.topic}`;
  }
}

export function saveStorytelling(
  userId: string | null,
  slot: StorytellingSlot,
  payload: Omit<CachedStorytelling, 'at'>,
) {
  if (!payload.text || payload.text.trim().length < 20) return;
  const bucket = readBucket(userId);
  bucket[slotKey(slot)] = { ...payload, at: new Date().toISOString() };
  writeBucket(userId, bucket);
}

export function getStorytelling(
  userId: string | null,
  slot: StorytellingSlot,
): CachedStorytelling | null {
  const bucket = readBucket(userId);
  const entry = bucket[slotKey(slot)];
  if (!entry) return null;
  const age = Date.now() - new Date(entry.at).getTime();
  if (age > TTL_MS) return null;
  return entry;
}

/** Lista todos os storytellings vivos do usuário (para o wizard mostrar quais já existem). */
export function listStorytellings(userId: string | null): Array<{ key: string; entry: CachedStorytelling }> {
  const bucket = readBucket(userId);
  const now = Date.now();
  return Object.entries(bucket)
    .filter(([, e]) => now - new Date(e.at).getTime() <= TTL_MS)
    .map(([key, entry]) => ({ key, entry }));
}

export function clearStorytellings(userId: string | null) {
  try { localStorage.removeItem(bucketKey(userId)); } catch { /* noop */ }
}
