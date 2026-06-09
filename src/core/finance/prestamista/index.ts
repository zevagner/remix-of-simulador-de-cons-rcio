/**
 * ════════════════════════════════════════════════════════════════════════════
 * SEGURO PRESTAMISTA — ENGINE CANÔNICA OPERACIONAL (Onda OP-V1 — 2026-05-12)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * ÚNICA fonte legítima de cálculo de Seguro Prestamista no sistema.
 *
 * REGRA OFICIAL CAIXA CONSÓRCIO (modelo operacional real, V1):
 *   • premium_mensal = Categoria Inicial × FatorOperacional × percentual FIXO
 *   • Categoria Inicial = Crédito + Taxa Administrativa + Fundo de Reserva
 *   • Percentuais FIXOS:
 *       0,0680% a.m. — cotas anteriores a 02/10/2023
 *       0,0765% a.m. — cotas a partir de 02/10/2023 (default)
 *   • FatorOperacional = lookup oficial em PRESTAMISTA_OPERATIONAL_TABLE_V1
 *     por (modalidade, prazo) — fallback controlado = 1.0
 *   • Premium é FIXO até o fim do grupo — NÃO amortiza, NÃO varia
 *   • Idade NÃO altera prêmio — apenas elegibilidade (idade + prazo ≤ 80a)
 *   • PJ → sem prestamista (premium = 0)
 * ════════════════════════════════════════════════════════════════════════════
 */
import {
  getPrestamistaRate,
  DEFAULT_PRESTAMISTA_COHORT,
  PRESTAMISTA_MAX_AGE_AT_END,
  PRESTAMISTA_MIN_AGE,
} from './constants';
import {
  getPrestamistaOperationalFactor,
  modalityFromConsortiumType,
  type PrestamistaModality,
} from '@/core/finance/insurance/prestamistaOperationalTables';
import type { ConsortiumType } from '@/types/consortium';
import type {
  PrestamistaPremiumInput,
  PrestamistaPremiumResult,
  PrestamistaEligibilityInput,
  PrestamistaEligibilityResult,
  PrestamistaScheduleInput,
  PrestamistaScheduleResult,
  PrestamistaScheduleRow,
} from './types';

/**
 * Calcula o prêmio MENSAL FIXO do seguro prestamista.
 * Fórmula: premium = Categoria Inicial × FatorOperacional × taxa
 */
export function calculatePrestamistaPremium(
  input: PrestamistaPremiumInput,
): PrestamistaPremiumResult {
  const {
    initialCategory,
    cohort = DEFAULT_PRESTAMISTA_COHORT,
    personType = 'PF',
    enabled = true,
    operationalFactor = 1.0,
    modality,
  } = input;

  const safeFactor = Math.max(0, operationalFactor);

  if (personType === 'PJ') {
    return { premium: 0, rateApplied: 0, base: 0, operationalFactor: safeFactor, zeroReason: 'pj' };
  }
  if (!enabled) {
    return { premium: 0, rateApplied: 0, base: 0, operationalFactor: safeFactor, zeroReason: 'disabled' };
  }
  const rawBase = Math.max(0, initialCategory || 0);
  if (rawBase <= 0) {
    return { premium: 0, rateApplied: 0, base: 0, operationalFactor: safeFactor, zeroReason: 'no_base' };
  }
  const rate = getPrestamistaRate(cohort, modality);
  const effectiveBase = rawBase * safeFactor;
  return { premium: effectiveBase * rate, rateApplied: rate, base: effectiveBase, operationalFactor: safeFactor };
}

/**
 * ÚNICA engine institucional oficial — resolve o fator operacional via
 * lookup CAIXA (modalidade × prazo) e devolve premium fixo + cronograma.
 *
 * Esta é a fachada esperada para todos os módulos (Simulador, PDF, IA,
 * Structured Ops, Comparator, Carteira, Pós-venda, Analytics).
 */
export interface OperationalPrestamistaInput {
  /** Crédito contratado (R$). */
  creditValue: number;
  /** Taxa Administrativa total (R$ — já calculada). */
  adminFeeTotal: number;
  /** Fundo de Reserva total (R$ — já calculado). */
  reserveFundTotal: number;
  /** Prazo do plano em meses. */
  termMonths: number;
  /** Modalidade operacional (chave da tabela). */
  modality: PrestamistaModality;
  cohort?: PrestamistaPremiumInput['cohort'];
  personType?: PrestamistaPremiumInput['personType'];
  enabled?: boolean;
}

export interface OperationalPrestamistaResult {
  monthlyPremium: number;
  totalPremium: number;
  rateApplied: number;
  operationalFactor: number;
  factorSource: 'exact' | 'fallback';
  initialCategory: number;
  zeroReason?: 'pj' | 'disabled' | 'no_base';
}

export function calculateOperationalPrestamista(
  input: OperationalPrestamistaInput,
): OperationalPrestamistaResult {
  const {
    creditValue,
    adminFeeTotal,
    reserveFundTotal,
    termMonths,
    modality,
    cohort,
    personType = 'PF',
    enabled = true,
  } = input;

  const initialCategory =
    Math.max(0, creditValue || 0) +
    Math.max(0, adminFeeTotal || 0) +
    Math.max(0, reserveFundTotal || 0);
  const term = Math.max(0, Math.floor(termMonths || 0));

  const factor = getPrestamistaOperationalFactor(modality, term);
  const premium = calculatePrestamistaPremium({
    initialCategory,
    cohort,
    personType,
    enabled,
    operationalFactor: factor.factor,
    modality,
  });

  return {
    monthlyPremium: premium.premium,
    totalPremium: premium.premium * term,
    rateApplied: premium.rateApplied,
    operationalFactor: factor.factor,
    factorSource: factor.source,
    initialCategory,
    zeroReason: premium.zeroReason,
  };
}

/** Conveniência: resolve modalidade a partir do ConsortiumType e roteia. */
export function calculateOperationalPrestamistaForType(
  input: Omit<OperationalPrestamistaInput, 'modality'> & { consortiumType: ConsortiumType },
): OperationalPrestamistaResult {
  const { consortiumType, ...rest } = input;
  return calculateOperationalPrestamista({
    ...rest,
    modality: modalityFromConsortiumType(consortiumType),
  });
}

/**
 * Valida elegibilidade — ÚNICO lugar onde a idade entra na regra do prestamista.
 * Regra CAIXA: idade do proponente + prazo do plano (em anos) ≤ 80 anos.
 */
export function validatePrestamistaEligibility(
  input: PrestamistaEligibilityInput,
): PrestamistaEligibilityResult {
  const { proponentAge, termMonths, personType = 'PF' } = input;

  if (personType === 'PJ') {
    return {
      eligible: false,
      ageAtEnd: 0,
      reason: 'pj',
      message: 'Pessoa Jurídica não possui Seguro Prestamista.',
    };
  }
  if (
    !Number.isFinite(proponentAge) ||
    !Number.isFinite(termMonths) ||
    proponentAge < 0 ||
    termMonths < 0
  ) {
    return { eligible: false, ageAtEnd: 0, reason: 'invalid_input', message: 'Idade ou prazo inválidos.' };
  }
  if (proponentAge < PRESTAMISTA_MIN_AGE) {
    return {
      eligible: false,
      ageAtEnd: proponentAge,
      reason: 'age_below_min',
      message: `Idade mínima do proponente: ${PRESTAMISTA_MIN_AGE} anos.`,
    };
  }
  const ageAtEnd = proponentAge + termMonths / 12;
  if (ageAtEnd >= PRESTAMISTA_MAX_AGE_AT_END) {
    return {
      eligible: false,
      ageAtEnd,
      reason: 'age_at_end_exceeds_limit',
      message: `Idade ao final do plano (${ageAtEnd.toFixed(1)}a) excede o limite de ${PRESTAMISTA_MAX_AGE_AT_END} anos.`,
    };
  }
  return { eligible: true, ageAtEnd };
}

/**
 * Cronograma operacional — premium FIXO replicado por N meses.
 * Aceita `operationalFactor` para preservar paridade com a engine canônica.
 */
export function calculatePrestamistaSchedule(
  input: PrestamistaScheduleInput,
): PrestamistaScheduleResult {
  const {
    initialCategory,
    termMonths,
    cohort = DEFAULT_PRESTAMISTA_COHORT,
    personType = 'PF',
    enabled = true,
    operationalFactor = 1.0,
    modality,
  } = input;

  const term = Math.max(0, Math.floor(termMonths || 0));
  const safeFactor = Math.max(0, operationalFactor);

  if (personType === 'PJ') {
    return { rows: [], totalPremium: 0, monthlyPremium: 0, rateApplied: 0, operationalFactor: safeFactor, zeroReason: 'pj' };
  }
  if (!enabled) {
    return { rows: [], totalPremium: 0, monthlyPremium: 0, rateApplied: 0, operationalFactor: safeFactor, zeroReason: 'disabled' };
  }
  if (term === 0 || initialCategory <= 0) {
    return {
      rows: [], totalPremium: 0, monthlyPremium: 0,
      rateApplied: getPrestamistaRate(cohort, modality),
      operationalFactor: safeFactor,
      zeroReason: 'no_base',
    };
  }

  const { premium: monthlyPremium, rateApplied } = calculatePrestamistaPremium({
    initialCategory, cohort, personType, enabled: true, operationalFactor: safeFactor, modality,
  });

  const rows: PrestamistaScheduleRow[] = Array.from({ length: term }, (_, i) => ({
    month: i + 1,
    premium: monthlyPremium,
  }));

  return {
    rows,
    totalPremium: monthlyPremium * term,
    monthlyPremium,
    rateApplied,
    operationalFactor: safeFactor,
  };
}

// ─── Re-exports públicos ────────────────────────────────────────────────────
export {
  PRESTAMISTA_RATE_LEGACY,
  PRESTAMISTA_RATE_CURRENT,
  PRESTAMISTA_COHORT_CUTOFF_ISO,
  PRESTAMISTA_MAX_AGE_AT_END,
  PRESTAMISTA_MIN_AGE,
  DEFAULT_PRESTAMISTA_COHORT,
  getPrestamistaRate,
  cohortFromContractDate,
} from './constants';
export {
  getPrestamistaOperationalFactor,
  modalityFromConsortiumType,
  PRESTAMISTA_OPERATIONAL_TABLE_V1,
  type PrestamistaModality,
  type PrestamistaOperationalRow,
  type PrestamistaOperationalFactorResult,
} from '@/core/finance/insurance/prestamistaOperationalTables';
export type {
  PersonType,
  PrestamistaCohort,
  PrestamistaPremiumInput,
  PrestamistaPremiumResult,
  PrestamistaEligibilityInput,
  PrestamistaEligibilityResult,
  PrestamistaScheduleInput,
  PrestamistaScheduleResult,
  PrestamistaScheduleRow,
} from './types';
