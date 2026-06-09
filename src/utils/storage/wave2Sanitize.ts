/**
 * ════════════════════════════════════════════════════════════════════════════
 * Storage Sanitize — Wave 2 (strategy-v2 definitive removal)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Onda 2 do plano de limpeza arquitetural V2.4 LOCKED.
 *
 * Contexto: a árvore `src/components/modules/strategy-v2/*` foi
 * permanentemente removida. Esta migration limpa as persistências órfãs
 * que sobreviveram em sessões existentes.
 *
 * Chaves saneadas:
 *   • `strategyV2:compareSelection:v1` (sessionStorage) — selectedIds do
 *     antigo `CompareSelectionProvider`.
 *   • `strategyV2` (localStorage) — override de feature flag do
 *     `isStrategyPresentationV2Enabled` (função removida).
 *
 * Snapshot da arquitetura removida: `.lovable/audit/strategy-v2-removal-snapshot.md`.
 *
 * REGRAS:
 *   • Idempotente — flag `wave2:sanitized:v1`.
 *   • Não toca em chaves ativas.
 *   • Sem efeito visual / matemático / consultivo.
 * ════════════════════════════════════════════════════════════════════════════
 */

const SANITIZE_FLAG_KEY = 'wave2:sanitized:v1';
const ORPHAN_LOCAL_KEYS = ['strategyV2'] as const;
const ORPHAN_SESSION_KEYS = ['strategyV2:compareSelection:v1'] as const;

export interface Wave2SanitizeReport {
  ran: boolean;
  removedLocal: string[];
  removedSession: string[];
}

export function runWave2Sanitize(): Wave2SanitizeReport {
  const report: Wave2SanitizeReport = { ran: false, removedLocal: [], removedSession: [] };
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

  try { window.localStorage.setItem(SANITIZE_FLAG_KEY, '1'); } catch { /* ignore */ }
  report.ran = true;
  return report;
}
