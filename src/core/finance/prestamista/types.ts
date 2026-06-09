/**
 * ════════════════════════════════════════════════════════════════════════════
 * SEGURO PRESTAMISTA — TIPAGEM CANÔNICA (modelo OPERACIONAL CAIXA)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Regra oficial CAIXA Consórcio (operacional):
 *   prêmio_mensal = (Crédito + Taxa Adm + Fundo Reserva) × percentual_FIXO
 *                 = Categoria Inicial × 0,0765% (cota nova)
 *
 * O prêmio é FIXO ao longo de TODO o grupo. NÃO acompanha saldo devedor,
 * NÃO amortiza, NÃO varia mês a mês. Idade entra APENAS na elegibilidade.
 * ════════════════════════════════════════════════════════════════════════════
 */
import type { PersonType, PrestamistaCohort } from './constants';

export type { PersonType, PrestamistaCohort } from './constants';

/** Input do cálculo do prêmio mensal (operacional — fixo). */
export interface PrestamistaPremiumInput {
  /**
   * Categoria Inicial (R$) = Crédito + Taxa Administrativa + Fundo de Reserva.
   * Base oficial CAIXA — fixa para todo o plano (não varia mês a mês).
   */
  initialCategory: number;
  /** Coorte da cota (default: post_2023_10_02). */
  cohort?: PrestamistaCohort;
  /** Pessoa Física ou Jurídica (default: PF). PJ → 0. */
  personType?: PersonType;
  /** Toggle do produto (default: true). false → 0. */
  enabled?: boolean;
  /**
   * Fator operacional CAIXA aplicado sobre a Categoria Inicial.
   * Default = 1.0 (compatibilidade). Em produção é resolvido via
   * `getPrestamistaOperationalFactor(modality, termMonths)`.
   * Ver: src/core/finance/insurance/prestamistaOperationalTables.ts.
   */
  operationalFactor?: number;
  /**
   * Modalidade operacional (real_estate / vehicle_light / vehicle_heavy).
   * Determina a taxa vigente aplicável (imobiliária vs veículos).
   * Omitido → comportamento histórico (taxa de veículos).
   */
  modality?: 'vehicle_light' | 'vehicle_heavy' | 'real_estate';
}

/** Resultado do prêmio mensal (mesmo valor para todos os meses do plano). */
export interface PrestamistaPremiumResult {
  /** Valor do prêmio mensal FIXO (R$). 0 se PJ, desabilitado ou base ≤ 0. */
  premium: number;
  /** Percentual mensal aplicado (decimal). 0 quando premium = 0. */
  rateApplied: number;
  /** Base de cálculo (= max(0, initialCategory) × operationalFactor). */
  base: number;
  /** Fator operacional aplicado (default 1.0). */
  operationalFactor: number;
  /** Motivo de zeragem, se aplicável. */
  zeroReason?: 'pj' | 'disabled' | 'no_base';
}

/** Input da elegibilidade. */
export interface PrestamistaEligibilityInput {
  proponentAge: number;
  termMonths: number;
  personType?: PersonType;
}

/** Resultado da elegibilidade. */
export interface PrestamistaEligibilityResult {
  eligible: boolean;
  ageAtEnd: number;
  reason?: 'pj' | 'age_below_min' | 'age_at_end_exceeds_limit' | 'invalid_input';
  message?: string;
}

/** Input do cronograma operacional (premium fixo replicado N meses). */
export interface PrestamistaScheduleInput {
  /** Categoria inicial (FC + TA + FR). */
  initialCategory: number;
  /** Prazo do plano em meses. */
  termMonths: number;
  cohort?: PrestamistaCohort;
  personType?: PersonType;
  enabled?: boolean;
  /** Fator operacional (default 1.0). */
  operationalFactor?: number;
  /** Modalidade operacional — determina a taxa oficial CAIXA. */
  modality?: 'vehicle_light' | 'vehicle_heavy' | 'real_estate';
}

/** Linha do cronograma (todos os meses têm o MESMO premium). */
export interface PrestamistaScheduleRow {
  month: number;
  premium: number;
}

/** Resultado do cronograma operacional. */
export interface PrestamistaScheduleResult {
  rows: PrestamistaScheduleRow[];
  /** premium × termMonths. */
  totalPremium: number;
  /** Valor do premium MENSAL fixo (mesmo para todos os meses). */
  monthlyPremium: number;
  rateApplied: number;
  /** Fator operacional aplicado. */
  operationalFactor: number;
  zeroReason?: 'pj' | 'disabled' | 'no_base';
}
