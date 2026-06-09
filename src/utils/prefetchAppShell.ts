/**
 * Prefetch do chunk principal do App (Index + AppShell) para reduzir o gap
 * perceptivo entre login → entrada no sistema.
 *
 * Estratégia: warm-up idempotente. Vite dedupe o dynamic import, então chamar
 * múltiplas vezes (focus do email, keystroke, login success) é seguro.
 */
let prefetched = false;

export function prefetchAppShell() {
  if (prefetched) return;
  prefetched = true;
  // Best-effort, sem await — não bloqueia UI.
  // Dispara em idle se disponível para não competir com o handshake de auth.
  const run = () => {
    import('@/pages/Index').catch(() => {
      // Silencioso: se falhar, o lazy() do App.tsx tenta novamente na navegação.
      prefetched = false;
    });
  };
  type IdleWindow = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
  };
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 200);
  }
}
