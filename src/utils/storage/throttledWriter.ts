/**
 * ════════════════════════════════════════════════════════════════════════════
 * Throttled storage writer — Wave 5 (Storage Write Throttling)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Helper único para persistência debounced em localStorage, com:
 *   • Fingerprint bailout (skip de writes estruturalmente idênticos).
 *   • Flush síncrono no unmount (não perde último estado).
 *   • Coalesce (timer cancela e reagenda a cada novo valor).
 *   • SSR-safe (no-op fora de window).
 *
 * NÃO substitui a UI local — apenas a persistência fica throttled. React
 * state é setado normalmente; apenas o `setItem` espera o usuário parar.
 *
 * Uso típico em providers (sliders/keystroke):
 *   const persist = useDebouncedLocalStorage(KEY, serializer);
 *   useEffect(() => { persist(value); }, [value, persist]);
 *
 * Default: 220ms — sweet spot entre responsividade percebida e coalescing.
 * UI local permanece instantânea (state setado fora deste helper).
 */
import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_DELAY_MS = 220;

export function safeWrite(key: string, serialized: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    /* quota / privado — ignorar silenciosamente */
  }
}

export function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch { /* ignore */ }
}

/**
 * Hook: persistência debounced de um valor em localStorage, com bailout por
 * fingerprint e flush no unmount. Retorna uma função idempotente `persist(value)`
 * que pode ser chamada a cada render (efeito) sem custo extra.
 *
 * @param key  Chave canônica do storage.
 * @param serialize  Converte valor → string (default = JSON.stringify).
 * @param delayMs  Atraso do debounce. Default 220ms.
 */
export function useDebouncedLocalStorage<T>(
  key: string,
  serialize: (value: T) => string = JSON.stringify,
  delayMs: number = DEFAULT_DELAY_MS,
): (value: T) => void {
  const fingerprintRef = useRef<string | null>(null);
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending === null) return;
    if (pending === fingerprintRef.current) return; // bailout
    safeWrite(key, pending);
    fingerprintRef.current = pending;
  }, [key]);

  const persist = useCallback((value: T) => {
    let serialized: string;
    try {
      serialized = serialize(value);
    } catch {
      return; // payload inválido — não persiste
    }
    // Bailout imediato: nada mudou estruturalmente.
    if (serialized === fingerprintRef.current && pendingRef.current === null) return;
    pendingRef.current = serialized;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, delayMs);
  }, [serialize, delayMs, flush]);

  // Flush no unmount — garante último valor persistido.
  useEffect(() => () => { flush(); }, [flush]);

  return persist;
}

/**
 * Versão para chaves cujo valor é simples (string | null). null → remove.
 */
export function useDebouncedLocalStorageString(
  key: string,
  delayMs: number = DEFAULT_DELAY_MS,
): (value: string | null) => void {
  const fingerprintRef = useRef<string | null>(null);
  const pendingRef = useRef<string | null | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    pendingRef.current = undefined;
    if (pending === undefined) return;
    const fp = pending === null ? '\0__null__' : pending;
    if (fp === fingerprintRef.current) return; // bailout
    if (pending === null) safeRemove(key);
    else safeWrite(key, pending);
    fingerprintRef.current = fp;
  }, [key]);

  const persist = useCallback((value: string | null) => {
    const fp = value === null ? '\0__null__' : value;
    if (fp === fingerprintRef.current && pendingRef.current === undefined) return;
    pendingRef.current = value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, delayMs);
  }, [flush, delayMs]);

  useEffect(() => () => { flush(); }, [flush]);

  return persist;
}
