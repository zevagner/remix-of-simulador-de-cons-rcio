/**
 * ════════════════════════════════════════════════════════════════════════════
 * CORE FINANCE — FACHADA PÚBLICA ÚNICA
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Esta é a ÚNICA entrada legítima para cálculo financeiro a partir da Onda 5.
 * Em Onda 0 (atual), funciona como re-export dos motores existentes para
 * permitir migração incremental sem quebra.
 *
 *   ✓ Use:    import { calculateMonthlySchedule } from '@/core/finance'
 *   ✗ Não:    import { calculateMonthlySchedule } from '@/utils/calculations'
 *
 * REGRAS:
 *  1. Fachada NÃO contém lógica nova — apenas re-exporta.
 *  2. Motor mensal (`calculateMonthlySchedule`) é a fonte de verdade.
 *  3. `calculateSimulationLegacy` exposto apenas para cenários paramétricos
 *     legítimos (Comparator, Investment, QuickSale) — NÃO usar em UI da
 *     sessão atual; consumir SimulatorContext.
 *  4. Imports diretos de `@/utils/calculations*` são bloqueados por ESLint
 *     em arquivos novos (warn em Onda 0, error em Onda 5).
 *
 * Plano completo: ver mem://arch/core-finance-fachada.
 * ════════════════════════════════════════════════════════════════════════════
 */

// ─── Motor mensal (fonte de verdade) ───
export {
  calculateMonthlySchedule,
  validateAgeAndTerm,
  type MonthlyScheduleInput,
  type MonthlyScheduleResult,
  type MonthlyRow,
  type AgeTermValidation,
} from './internal/monthlySchedule';

// ─── Prestamista canônico (Onda OP-V1 — engine operacional única) ───
export {
  getPrestamistaRate,
  PRESTAMISTA_RATE_CURRENT,
  PRESTAMISTA_RATE_LEGACY,
  calculatePrestamistaPremium,
  calculatePrestamistaSchedule,
  calculateOperationalPrestamista,
  calculateOperationalPrestamistaForType,
  getPrestamistaOperationalFactor,
  modalityFromConsortiumType,
  PRESTAMISTA_OPERATIONAL_TABLE_V1,
  validatePrestamistaEligibility,
  type PrestamistaCohort,
  type PersonType,
  type PrestamistaModality,
  type PrestamistaEligibilityResult,
} from './prestamista';

// ─── Reconciliação ───
export {
  reconcileWithSchedule,
  getEffectiveClientCost,
  type ReconcileOptions,
} from './internal/reconcile';

// ─── Motor agregado (LEGADO — uso restrito) ───
export {
  calculateSimulation,
  calculateSimulationLegacy,
  deriveContemplationType,
  formatCurrency,
  formatPercent,
} from './internal/calculations';

// ─── Engine de financiamento canônica (Onda B2) ───
export {
  calculateFinancingCost,
  calculatePriceSchedule,
  calculateSacSchedule,
  calculateCET,
  type FinancingResult,
  type FinancingInstallment,
  type FinancingScheduleInput,
  type FinancingScheduleResult,
  type CetInput,
  type CetResult,
} from './financing';

// ─── Primitivas de parcela (re-export canônico) ───
export {
  computeAdminFee,
  computeReserveFund,
  computeBaseCost,
  computeFullInstallment,
} from './installments';

// ─── Investimento (IR) ───
export { calculateIR } from '@/utils/calculations/investimento';

// ─── Investment Engine canônico (Onda B1) ───
export {
  annualToMonthlyRate,
  monthlyToAnnualRate,
  compoundGrowth,
  compoundGrowthAnnualMonthly,
  futureValueOfSeries,
  inccAdjust,
  inccAdjustYears,
  pricePmt,
  pricePmtAnnualMonthly,
  calculateInvestmentProjection,
  type InvestmentProjectionInput,
  type InvestmentProjectionResult,
} from './investment';

// ─── Análise de lances ───
export {
  analyzeBidHistory,
  estimateBidProbabilityMonteCarlo,
  type BidAnalysisResult,
  type GroupBehaviorAnalysis,
  type ContemplationZone,
} from '@/utils/calculations/lances';
