/**
 * Formatadores canônicos pt-BR.
 * ════════════════════════════
 *
 * Fonte única para formatação monetária e percentual. Substitui as
 * implementações duplicadas que existiam em:
 *  - src/utils/calculations.ts          (formatCurrency, formatPercent)
 *  - src/services/smartMessages.ts      (formatCurrencyShort, local)
 *  - src/utils/formatCreditRange.ts     (formatCurrencyBRL, local)
 *
 * Por compatibilidade, os arquivos antigos re-exportam destas funções —
 * call-sites existentes continuam funcionando sem alteração.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const BRL_SHORT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const PERCENT = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** R$ 1.234,56 */
export function formatCurrency(value: number): string {
  return BRL.format(value);
}

/** R$ 1.235 (sem centavos) — para WhatsApp e títulos curtos. */
export function formatCurrencyShort(value: number): string {
  return BRL_SHORT.format(value);
}

/** Alias histórico — mantido para evitar quebra em formatCreditRange. */
export const formatCurrencyBRL = formatCurrency;

/** Recebe valor em "100" para representar 100% (mesma convenção legada). */
export function formatPercent(value: number): string {
  return PERCENT.format(value / 100);
}
