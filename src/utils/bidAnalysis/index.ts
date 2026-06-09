/**
 * bidAnalysis — Fonte única de verdade para análise e projeção de lances.
 *
 * Estrutura:
 * - core.ts        → análise histórica (zonas, comportamento, recomendação, Monte Carlo, helpers)
 * - projection.ts  → projeção mês-a-mês e cenários (ex-bidsEngine)
 *
 * Esta fachada re-exporta TUDO de ambos sem alterar comportamento.
 */
export * from './core';
export * from './projection';
