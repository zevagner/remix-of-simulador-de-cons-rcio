/**
 * ════════════════════════════════════════════════════════════════════════════
 * CORE FINANCE — INVESTMENT ENGINE (Onda B1)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Engine institucional única para matemática patrimonial:
 *   • juros compostos (mensal, anual, equivalência)
 *   • crescimento (compound growth, future value of series)
 *   • INCC composto
 *   • Price PMT
 *
 * REGRA DE OURO:
 *   Nenhum hook, componente, gráfico, card ou tab pode usar Math.pow para
 *   compound financeiro. TUDO consome estas primitivas.
 *
 * Esta engine NÃO altera matemática — ela CENTRALIZA fórmulas que estavam
 * espalhadas em useInvestmentCalculations, useCashComparison,
 * ScenarioComparisonChart, CotaMultiplicationCard, ProposalPdfModule,
 * SharedProposalPage, FinancingComparisonTab, triggersData.
 *
 * Pipeline oficial:
 *   Investment Engine → Projection Result → Cards → Charts → Comparators → PDF/AI
 *
 * Doc viva: mem://arch/core-finance-fachada · mem://arch/state/investment-results-context
 * ════════════════════════════════════════════════════════════════════════════
 */

// ─── Equivalência de taxas ────────────────────────────────────────────────

/**
 * Converte taxa anual em equivalente mensal composta.
 *   i_mensal = (1 + i_anual)^(1/12) − 1
 *
 * @param annualRate taxa anual em decimal (ex.: 0.12 para 12% a.a.)
 */
export function annualToMonthlyRate(annualRate: number): number {
  if (annualRate === 0) return 0;
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Converte taxa mensal em equivalente anual composta.
 *   i_anual = (1 + i_mensal)^12 − 1
 */
export function monthlyToAnnualRate(monthlyRate: number): number {
  if (monthlyRate === 0) return 0;
  return Math.pow(1 + monthlyRate, 12) - 1;
}

// ─── Juros compostos ──────────────────────────────────────────────────────

/**
 * Capitalização composta de um principal único:
 *   FV = P × (1 + i)^n
 *
 * @param principal valor presente (R$)
 * @param ratePerPeriod taxa por período em decimal
 * @param periods número de períodos (≥ 0)
 */
export function compoundGrowth(principal: number, ratePerPeriod: number, periods: number): number {
  if (periods <= 0) return principal;
  if (ratePerPeriod === 0) return principal;
  return principal * Math.pow(1 + ratePerPeriod, periods);
}

/**
 * Capitalização composta a partir de TAXA ANUAL e prazo em MESES.
 * Atalho: `compoundGrowth(P, annualToMonthlyRate(i), months)`.
 */
export function compoundGrowthAnnualMonthly(principal: number, annualRate: number, months: number): number {
  return compoundGrowth(principal, annualToMonthlyRate(annualRate), months);
}

/**
 * Valor futuro de uma série uniforme de pagamentos (pagamento ao fim do período):
 *   FV = PMT × ((1 + i)^n − 1) / i
 *
 * Quando `i = 0`, degenera para PMT × n.
 */
export function futureValueOfSeries(payment: number, ratePerPeriod: number, periods: number): number {
  if (periods <= 0) return 0;
  if (ratePerPeriod === 0) return payment * periods;
  return payment * (Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod;
}

// ─── INCC ─────────────────────────────────────────────────────────────────

/**
 * Reajuste composto pelo INCC (anual → equivalente mensal → composto por mês).
 *   FV = base × (1 + i_mensal)^months
 *
 * @param baseValue valor a ser corrigido (carta, parcela, etc.)
 * @param annualInccPercent INCC anual em PERCENTUAL (ex.: 5 para 5%)
 * @param months número de meses de correção
 */
export function inccAdjust(baseValue: number, annualInccPercent: number, months: number): number {
  if (annualInccPercent <= 0 || months <= 0) return baseValue;
  const monthlyRate = annualToMonthlyRate(annualInccPercent / 100);
  return compoundGrowth(baseValue, monthlyRate, months);
}

/**
 * Reajuste pelo INCC com prazo em ANOS (uso histórico do CotaMultiplicationCard).
 *   FV = base × (1 + i_anual)^anos
 */
export function inccAdjustYears(baseValue: number, annualInccPercent: number, years: number): number {
  if (annualInccPercent <= 0 || years <= 0) return baseValue;
  return baseValue * Math.pow(1 + annualInccPercent / 100, years);
}

// ─── Price (PMT) ──────────────────────────────────────────────────────────

/**
 * Parcela do Sistema Price (amortização constante de juros compostos):
 *   PMT = PV × i × (1 + i)^n / ((1 + i)^n − 1)
 *
 * @param principal valor presente (saldo financiado)
 * @param ratePerPeriod taxa por período em decimal
 * @param periods número de parcelas
 */
export function pricePmt(principal: number, ratePerPeriod: number, periods: number): number {
  if (periods <= 0 || principal <= 0) return 0;
  if (ratePerPeriod === 0) return principal / periods;
  const factor = Math.pow(1 + ratePerPeriod, periods);
  return principal * (ratePerPeriod * factor) / (factor - 1);
}

/**
 * Price PMT a partir de TAXA ANUAL e prazo em MESES.
 */
export function pricePmtAnnualMonthly(principal: number, annualRate: number, months: number): number {
  return pricePmt(principal, annualToMonthlyRate(annualRate), months);
}

// ─── Tipos públicos (para futuras projeções estruturadas) ────────────────

export interface InvestmentProjectionInput {
  principal: number;
  monthlyContribution?: number;
  annualReturnRate: number; // decimal
  months: number;
}

export interface InvestmentProjectionResult {
  finalValue: number;
  totalContributed: number;
  totalEarnings: number;
}

/**
 * Projeção combinada: principal capitalizado + série uniforme de aportes.
 * Função utilitária para próximos consumers (cards/gráficos consumer-only).
 */
export function calculateInvestmentProjection(
  input: InvestmentProjectionInput,
): InvestmentProjectionResult {
  const monthlyRate = annualToMonthlyRate(input.annualReturnRate);
  const principalFV = compoundGrowth(input.principal, monthlyRate, input.months);
  const seriesFV = input.monthlyContribution
    ? futureValueOfSeries(input.monthlyContribution, monthlyRate, input.months)
    : 0;
  const finalValue = principalFV + seriesFV;
  const totalContributed = input.principal + (input.monthlyContribution ?? 0) * input.months;
  return {
    finalValue,
    totalContributed,
    totalEarnings: finalValue - totalContributed,
  };
}
