/**
 * ════════════════════════════════════════════════════════════════════════════
 * Storage Sanitize — Wave 3 (Analysis Force-Flag Consolidation)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Onda 3 do plano de hardening V2.4 LOCKED.
 *
 * Contexto: a navegação do módulo `analysis` foi consolidada na Fase 2 do
 * `analysis-decouple` sobre uma única fonte de verdade — `nav:lastSubmodule`
 * em `src/utils/navState.ts`. As três flags legadas que coexistiam para o
 * mesmo intent semântico ("aba ativa do Análise") são oficialmente removidas:
 *
 *   • `analysis:lastTab`         (localStorage)   — lastTab duplicado
 *   • `analysis:force-default`   (sessionStorage) — força entrada na overview
 *   • `analysis:force-overview`  (sessionStorage) — variante histórica
 *
 * Ownership canônico pós-Onda 3:
 *
 *   submódulo ativo   → `nav:lastSubmodule` (localStorage, via navState)
 *   módulo ativo      → `nav:lastModule`    (localStorage, via navState)
 *   restauração boot  → `Index.tsx` chama `readLastNavState()` antes do mount
 *   override entrada  → URL query (`?m=`) via `readUrlNavTarget()`
 *
 * Antes (3 flags fragmentadas):
 *   Index → lastTab? force-default? force-overview? → drift silencioso
 *
 * Depois (1 fonte canônica):
 *   Index → readLastNavState() → resolveTarget() → AnalysisModule(activeTab)
 *
 * REGRAS:
 *   • Idempotente — flag `wave3:sanitized:v1`.
 *   • Não toca em `nav:lastSubmodule` / `nav:lastModule` (fontes canônicas).
 *   • Sem efeito visual / matemático / consultivo / de navegação ativa.
 *   • Substitui a limpeza inline que rodava em `AnalysisModule` a cada mount.
 * ════════════════════════════════════════════════════════════════════════════
 */

const SANITIZE_FLAG_KEY = 'wave3:sanitized:v2';
const ORPHAN_LOCAL_KEYS = ['analysis:lastTab'] as const;
const ORPHAN_SESSION_KEYS = ['analysis:force-default', 'analysis:force-overview'] as const;
// Onda Cockpit Removal: limpar valores legados 'analysis-overview' das chaves canônicas.
const NAV_KEYS_TO_SCRUB = ['nav:lastModule', 'nav:lastSubmodule'] as const;
const LEGACY_OVERVIEW_VALUE = 'analysis-overview';

export interface Wave3SanitizeReport {
  ran: boolean;
  removedLocal: string[];
  removedSession: string[];
}

export function runWave3Sanitize(): Wave3SanitizeReport {
  const report: Wave3SanitizeReport = { ran: false, removedLocal: [], removedSession: [] };
  if (typeof window === 'undefined') return report;
  try {
    if (window.localStorage.getItem(SANITIZE_FLAG_KEY) === '1') return report;
  } catch {
    return report;
  }

  for (const key of ORPHAN_LOCAL_KEYS) {
    try {
      if (window.localStorage.getItem(key) !== null) {
        window.localStorage.removeItem(key);
        report.removedLocal.push(key);
      }
    } catch { /* ignore */ }
  }

  for (const key of ORPHAN_SESSION_KEYS) {
    try {
      if (window.sessionStorage.getItem(key) !== null) {
        window.sessionStorage.removeItem(key);
        report.removedSession.push(key);
      }
    } catch { /* ignore */ }
  }

  // Onda Cockpit Removal: zera valores 'analysis-overview' persistidos nas chaves canônicas.
  for (const key of NAV_KEYS_TO_SCRUB) {
    try {
      if (window.localStorage.getItem(key) === LEGACY_OVERVIEW_VALUE) {
        window.localStorage.removeItem(key);
        report.removedLocal.push(key);
      }
    } catch { /* ignore */ }
  }

  try { window.localStorage.setItem(SANITIZE_FLAG_KEY, '1'); } catch { /* ignore */ }
  report.ran = true;
  return report;
}
