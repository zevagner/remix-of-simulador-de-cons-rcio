/**
 * Centralized consortium & financial defaults.
 * ══════════════════════════════════════════════
 * Single source of truth for ALL rates, terms and financial parameters.
 * Every module MUST import from here — never hardcode rates.
 */
import { ConsortiumType } from '@/types/consortium';

// ─── Consortium rates (CAIXA standard) ───

/** Default admin fee (%) per consortium type */
export const DEFAULT_ADMIN_FEE: Record<ConsortiumType, number> = {
  imobiliario: 18,
  auto: 17,
  pesados: 17,
};

/** Default reserve fund (%) per consortium type */
export const DEFAULT_RESERVE_FUND: Record<ConsortiumType, number> = {
  imobiliario: 3,
  auto: 3,
  pesados: 3,
};

/** Default term (months) per consortium type — also used as the Caixa
 *  reference total term for the "credit letter update" warning. */
export const DEFAULT_TERM_MONTHS: Record<ConsortiumType, number> = {
  imobiliario: 200,
  auto: 80,
  pesados: 100,
};

/** Prazo máximo permitido (meses) por tipo de consórcio — regra oficial CAIXA.
 *  Fonte única de verdade. NUNCA hardcodar em outros módulos. */
export const MAX_TERM_MONTHS: Record<ConsortiumType, number> = {
  imobiliario: 200,
  auto: 80,
  pesados: 100,
};

/** Threshold (in months elapsed) above which the user should be warned to
 *  verify if the credit letter value is up to date. */
export const CREDIT_LETTER_UPDATE_WARNING_MONTHS = 12;

/** Max months of reduced installment per consortium type */
export const MAX_REDUCED_INSTALLMENT_MONTHS: Record<ConsortiumType, number> = {
  imobiliario: 80,
  auto: 30,
  pesados: 30,
};

/** Reduced installment factor (multiplier applied to normal installment) */
export const REDUCED_INSTALLMENT_FACTOR = 0.7;

// ─── Embedded bid limits (regra oficial CAIXA) ───

/**
 * Limite máximo de lance embutido (%) por tipo de consórcio.
 * Fonte única de verdade — NUNCA hardcodar esse valor em outro lugar.
 *
 * Regras oficiais:
 * - Imobiliário: 50% (permite alavancagem com carta dobrada)
 * - Veículos (auto): 30%
 * - Pesados: 30%
 */
export const EMBEDDED_BID_MAX_PERCENT: Record<ConsortiumType, number> = {
  imobiliario: 50,
  auto: 30,
  pesados: 30,
};

/** Helper: retorna o limite máximo de lance embutido para um tipo de consórcio */
export function getEmbeddedBidMaxPercent(type: ConsortiumType): number {
  return EMBEDDED_BID_MAX_PERCENT[type] ?? 0;
}

// ─── Insurance ───

/** Default MIP insurance rate (%) — fallback when no age-specific rate applies */
export const DEFAULT_INSURANCE_PERCENT = 0.028933;

/** Default proponent age for simulations */
export const DEFAULT_PROPONENT_AGE = 30;

// ─── Financing comparison defaults ───

/** Default annual financing rate (%) — used in Comparator and Summary */
export const DEFAULT_FINANCING_RATE = 12;

/** Default MIP rate for financing comparison (%) */
export const DEFAULT_FINANCING_MIP_RATE = 0.02;

/** Default DFI rate for financing comparison (%) */
export const DEFAULT_FINANCING_DFI_RATE = 0.03;

/** Default monthly admin fee for financing (R$) */
export const DEFAULT_FINANCING_ADMIN_FEE_MONTHLY = 25;

// ─── Cash comparison defaults ───

/** Default CDI rate (% a.a.) */
export const DEFAULT_CDI_RATE = 14.90;

/** Default CDI investment percentage (% do CDI) */
export const DEFAULT_INVESTMENT_RATE = 100;

/** Default embedded bid percent for cash comparison */
export const DEFAULT_CASH_EMBEDDED_BID_PERCENT = 50;

/** Default free bid percent for cash comparison */
export const DEFAULT_CASH_FREE_BID_PERCENT = 25;

/**
 * Multiplicador da carta dobrada (estratégia de alavancagem CAIXA).
 * ─────────────────────────────────────────────────────────────────
 * Quando o cliente compara consórcio vs compra à vista de um imóvel,
 * a estratégia oficial é contratar uma carta de crédito de valor
 * EQUIVALENTE AO DOBRO do imóvel desejado, aproveitando o lance
 * embutido (até 50% no imobiliário) para reduzir o saldo devedor
 * para o valor do imóvel — mantendo o capital próprio aplicado
 * rendendo CDI durante todo o prazo.
 *
 * Usar APENAS no contexto da aba "vs Compra à Vista" do Comparador.
 * Não confundir com lance embutido (EMBEDDED_BID_MAX_PERCENT) nem
 * com fator de parcela reduzida (REDUCED_INSTALLMENT_FACTOR).
 */
export const CASH_LEVERAGE_MULTIPLIER = 2;

// ─── Helpers ───

/**
 * Suggest admin fee based on consortium type and credit value.
 * Returns a value-aware suggestion that the user can override.
 */
export function getSuggestedAdminFee(type: ConsortiumType, creditValue: number): number {
  switch (type) {
    case 'imobiliario':
      return creditValue > 400_000 ? 18 : 20;
    case 'auto':
      return 17.5;
    case 'pesados':
      return 15;
    default:
      return DEFAULT_ADMIN_FEE[type];
  }
}

/** Get all default rates for a given consortium type */
export function getDefaultRates(type: ConsortiumType) {
  return {
    adminFeePercent: DEFAULT_ADMIN_FEE[type],
    reserveFundPercent: DEFAULT_RESERVE_FUND[type],
    termMonths: DEFAULT_TERM_MONTHS[type],
    maxReducedMonths: MAX_REDUCED_INSTALLMENT_MONTHS[type],
    insurancePercent: DEFAULT_INSURANCE_PERCENT,
    proponentAge: DEFAULT_PROPONENT_AGE,
  };
}
