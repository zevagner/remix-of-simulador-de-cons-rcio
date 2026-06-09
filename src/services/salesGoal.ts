/**
 * Sales Goal — meta mensal persistida em localStorage por usuário.
 * Não exige schema novo no backend. Chave inclui userId quando disponível.
 */
const KEY_PREFIX = 'sales-goal-monthly:';
const KEY_GLOBAL = 'sales-goal-monthly:default';

function key(userId?: string | null): string {
  return userId ? `${KEY_PREFIX}${userId}` : KEY_GLOBAL;
}

export function getMonthlyGoal(userId?: string | null): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setMonthlyGoal(value: number, userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const v = Math.max(0, Math.round(Number(value) || 0));
    window.localStorage.setItem(key(userId), String(v));
    window.dispatchEvent(new CustomEvent('sales-goal-changed', { detail: { value: v } }));
  } catch {
    /* ignore */
  }
}
