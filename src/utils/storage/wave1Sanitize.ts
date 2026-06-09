/**
 * ════════════════════════════════════════════════════════════════════════════
 * Storage Sanitize — Wave 1 (Legacy Cleanup, baixo risco)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Onda 1 do plano de limpeza arquitetural V2.4 LOCKED.
 *
 * Objetivo desta migration:
 *   1. Saneamento idempotente do `wealth:assumptions:v1`:
 *      remove os campos órfãos `contemplationMonth` e `analysisMonths`
 *      que continuavam persistidos em usuários antigos APÓS a unificação
 *      "Premissas da Simulação → Single Source of Truth (Simulador)".
 *      Esses campos não têm mais consumer — viraram stale state silencioso
 *      e contaminavam snapshots de PDF.
 *
 *   2. Limpeza de chaves órfãs confirmadas SEM runtime ativo:
 *      • `system_validation_logs` (histórico do SystemValidationLogViewer
 *        — viewer removido nesta mesma onda).
 *
 * REGRAS DURAS desta onda:
 *   • NÃO altera matemática.
 *   • NÃO altera comportamento consultivo.
 *   • NÃO altera UX.
 *   • NÃO remove chaves com runtime ativo (strategyV2:compareSelection:v1,
 *     active-strategy:v1, nav:last*, simulator-*, strategy:sim-slice:v1
 *     permanecem intactas).
 *   • PRESERVA premissas legítimas do usuário (CDI, yield, ágio, etc).
 *   • Idempotente: rodar N vezes = rodar 1 vez.
 *   • Flag `wave1:sanitized:v1` evita reprocessamento.
 *
 * Doc de ownership: `docs/architecture/storage-keys-ownership.md`.
 * ════════════════════════════════════════════════════════════════════════════
 */

const SANITIZE_FLAG_KEY = 'wave1:sanitized:v1';
const WEALTH_ASSUMPTIONS_KEY = 'wealth:assumptions:v1';

/** Campos legados removidos das WealthAssumptions persistidas. */
const STALE_WEALTH_ASSUMPTION_FIELDS = ['contemplationMonth', 'analysisMonths'] as const;

/** Chaves de storage órfãs (sem consumer/runtime ativo) — Onda 1. */
const ORPHAN_KEYS_TO_REMOVE = ['system_validation_logs'] as const;

export interface Wave1SanitizeReport {
  ran: boolean;
  wealthAssumptionsCleaned: boolean;
  orphanKeysRemoved: string[];
}

export function runWave1Sanitize(): Wave1SanitizeReport {
  const report: Wave1SanitizeReport = {
    ran: false,
    wealthAssumptionsCleaned: false,
    orphanKeysRemoved: [],
  };
  if (typeof window === 'undefined') return report;
  try {
    if (window.localStorage.getItem(SANITIZE_FLAG_KEY) === '1') return report;
  } catch {
    return report;
  }

  // 1) Sanitize wealth:assumptions:v1 — strip stale fields, preserve resto.
  try {
    const raw = window.localStorage.getItem(WEALTH_ASSUMPTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      let mutated = false;
      for (const field of STALE_WEALTH_ASSUMPTION_FIELDS) {
        if (field in parsed) {
          delete parsed[field];
          mutated = true;
        }
      }
      if (mutated) {
        window.localStorage.setItem(WEALTH_ASSUMPTIONS_KEY, JSON.stringify(parsed));
        report.wealthAssumptionsCleaned = true;
      }
    }
  } catch { /* leitura corrompida — ignora, não bloqueia boot */ }

  // 2) Remover chaves órfãs confirmadas.
  for (const key of ORPHAN_KEYS_TO_REMOVE) {
    try {
      if (window.localStorage.getItem(key) !== null) {
        window.localStorage.removeItem(key);
        report.orphanKeysRemoved.push(key);
      }
    } catch { /* ignore */ }
  }

  try { window.localStorage.setItem(SANITIZE_FLAG_KEY, '1'); } catch { /* ignore */ }
  report.ran = true;
  return report;
}
