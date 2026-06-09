/**
 * ════════════════════════════════════════════════════════════════════════════
 * SHIM CANÔNICO (Onda 2B) — Seguro Prestamista
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Este módulo era a "tabela MIP por idade" (10 faixas etárias). A regra
 * oficial CAIXA NÃO varia o prêmio por idade — varia apenas a coorte
 * (cota antiga 0,0680% / cota nova 0,0765%). Idade entra APENAS na
 * elegibilidade (idade + prazo ≤ 80 anos).
 *
 * Onda 2B removeu:
 *   ✗ MIP_AGE_RANGES  — tabela etária inexistente no produto oficial
 *   ✗ getMIPAgeRangeLabel — sugeria cálculo por faixa etária
 *
 * Mantido apenas como compat de assinatura para tests legados:
 *   - getMIPRateByAge(_age?, cohort?)  → ignora age, retorna taxa canônica em %
 *   - isValidProponentAge(age)         → validação básica de faixa etária mínima
 *
 * USO RECOMENDADO (novo código):
 *   import { getPrestamistaRate, calculatePrestamistaPremium } from '@/core/finance';
 *
 * ════════════════════════════════════════════════════════════════════════════
 */
import {
  getPrestamistaRate,
  PRESTAMISTA_RATE_CURRENT,
  PRESTAMISTA_RATE_LEGACY,
  PRESTAMISTA_MIN_AGE,
  PRESTAMISTA_MAX_AGE_AT_END,
  type PrestamistaCohort,
} from '@/core/finance/prestamista';

/**
 * Retorna o percentual mensal canônico de Prestamista (em %).
 *
 * @param _age Ignorado — assinatura preservada por compat de testes legados.
 * @param cohort Coorte da cota (default: cota nova).
 *
 * @deprecated Use `getPrestamistaRate(cohort) * 100` ou
 * `calculatePrestamistaPremium` da fachada `@/core/finance`.
 */
export function getMIPRateByAge(
  _age?: number,
  cohort: PrestamistaCohort = 'post_2023_10_02',
): number {
  return getPrestamistaRate(cohort) * 100;
}

/**
 * Valida elegibilidade etária mínima (apenas faixa do proponente, sem prazo).
 * Para validar idade + prazo (regra oficial), use `validatePrestamistaEligibility`
 * da engine canônica.
 */
export function isValidProponentAge(age: number): boolean {
  return age >= PRESTAMISTA_MIN_AGE && age <= PRESTAMISTA_MAX_AGE_AT_END;
}

/** @deprecated Re-export para conveniência durante migração. */
export { PRESTAMISTA_RATE_CURRENT, PRESTAMISTA_RATE_LEGACY };
