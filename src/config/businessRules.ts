/**
 * BUSINESS_RULES — Fachada única de regras de negócio do sistema.
 * ════════════════════════════════════════════════════════════════
 *
 * Este arquivo NÃO redefine valores. Ele AGRUPA e RE-EXPORTA as
 * fontes de verdade que já existem (consortiumRates.ts, mipRates.ts)
 * sob uma estrutura de namespace única, facilitando descoberta e
 * impedindo que novos módulos hardcodem regras.
 *
 * REGRA DE OURO: ao adicionar uma nova regra ao sistema, registre-a
 * aqui ANTES de usá-la em qualquer outro arquivo. Se o valor mudar,
 * mude no arquivo-fonte (consortiumRates.ts) — NUNCA aqui.
 *
 * ─── Como usar ───
 *   import { BUSINESS_RULES } from '@/config/businessRules';
 *   BUSINESS_RULES.embeddedBid.imobiliario  // 50
 *   BUSINESS_RULES.adminFee.default.auto    // 17
 *   BUSINESS_RULES.installment.reducedFactor // 0.7
 *
 * Imports diretos de consortiumRates.ts permanecem válidos para
 * compatibilidade — esta fachada é aditiva, não substitutiva.
 */
import {
  EMBEDDED_BID_MAX_PERCENT,
  getEmbeddedBidMaxPercent,
  DEFAULT_ADMIN_FEE,
  DEFAULT_RESERVE_FUND,
  DEFAULT_TERM_MONTHS,
  MAX_TERM_MONTHS,
  MAX_REDUCED_INSTALLMENT_MONTHS,
  REDUCED_INSTALLMENT_FACTOR,
  DEFAULT_INSURANCE_PERCENT,
  DEFAULT_PROPONENT_AGE,
  DEFAULT_FINANCING_RATE,
  DEFAULT_FINANCING_MIP_RATE,
  DEFAULT_FINANCING_DFI_RATE,
  DEFAULT_FINANCING_ADMIN_FEE_MONTHLY,
  DEFAULT_CDI_RATE,
  DEFAULT_INVESTMENT_RATE,
  DEFAULT_CASH_EMBEDDED_BID_PERCENT,
  DEFAULT_CASH_FREE_BID_PERCENT,
  CASH_LEVERAGE_MULTIPLIER,
  getSuggestedAdminFee,
  getDefaultRates,
} from './consortiumRates';

export const BUSINESS_RULES = {
  /** Limite máximo (%) de lance embutido por tipo de consórcio. */
  embeddedBid: EMBEDDED_BID_MAX_PERCENT,

  /** Taxas administrativas (%) por tipo. `default` = baseline; `suggested` = ajustada por valor. */
  adminFee: {
    default: DEFAULT_ADMIN_FEE,
    /** Sugestão context-aware (ex.: imobiliário > 400k usa 18, senão 20). */
    suggested: getSuggestedAdminFee,
  },

  /** Fundo de reserva (%) por tipo. */
  reserveFund: DEFAULT_RESERVE_FUND,

  /** Prazos (meses) por tipo. */
  term: {
    default: DEFAULT_TERM_MONTHS,
    max: MAX_TERM_MONTHS,
  },

  /** Regras de parcela reduzida. */
  installment: {
    /** Multiplicador aplicado à parcela cheia durante o período de redução. */
    reducedFactor: REDUCED_INSTALLMENT_FACTOR,
    /** Limite (meses) de duração da parcela reduzida por tipo. */
    maxReducedMonths: MAX_REDUCED_INSTALLMENT_MONTHS,
  },

  /** Seguro prestamista (MIP). */
  insurance: {
    /** Taxa MIP fallback (%) quando não há regra por idade. */
    defaultPercent: DEFAULT_INSURANCE_PERCENT,
    /** Idade default do proponente para simulações iniciais. */
    defaultAge: DEFAULT_PROPONENT_AGE,
  },

  /** Defaults usados pelo Comparador (financiamento). */
  financing: {
    annualRate: DEFAULT_FINANCING_RATE,
    mipRate: DEFAULT_FINANCING_MIP_RATE,
    dfiRate: DEFAULT_FINANCING_DFI_RATE,
    monthlyAdminFee: DEFAULT_FINANCING_ADMIN_FEE_MONTHLY,
  },

  /** Defaults usados pelo Comparador (compra à vista vs investimento). */
  cash: {
    cdiRate: DEFAULT_CDI_RATE,
    investmentRatePercent: DEFAULT_INVESTMENT_RATE,
    embeddedBidPercent: DEFAULT_CASH_EMBEDDED_BID_PERCENT,
    freeBidPercent: DEFAULT_CASH_FREE_BID_PERCENT,
    /** Multiplicador da carta dobrada — ver consortiumRates.ts. */
    leverageMultiplier: CASH_LEVERAGE_MULTIPLIER,
  },
} as const;

// Helpers re-exportados (nomes preservados)
export {
  getEmbeddedBidMaxPercent,
  getSuggestedAdminFee,
  getDefaultRates,
};

export type BusinessRules = typeof BUSINESS_RULES;
