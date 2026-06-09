/**
 * Reconciliação SimulationResult (legado) × MonthlyScheduleResult (atuarial).
 * ════════════════════════════════════════════════════════════════════════
 *
 * O sistema tem dois motores rodando lado a lado:
 *  - calculateSimulation (legado, agregado, cobre os 4 cenários pós-contemplação)
 *  - calculateMonthlySchedule (atuarial, mês-a-mês, fonte da verdade financeira)
 *
 * **Onda A — Single Source of Truth da PARCELA** (2026-05-12)
 * ────────────────────────────────────────────────────────────
 * Esta função projeta os agregados do schedule de volta no shape do
 * SimulationResult. Todos os campos de PARCELA passam a ser derivados
 * exclusivamente do motor mensal, eliminando o drift histórico em que
 * `result.fullInstallment` ainda vinha do legado (saldo constante).
 *
 * Mapeamento canônico:
 *   - totalCost                   ← schedule.costWithInsurance
 *   - insuranceTotal              ← schedule.totalInsurance
 *   - monthlyInsurance            ← totalInsurance / termMonths
 *   - fullInstallment             ← (creditValue + adminFee + reserveFund + totalInsurance) / termMonths
 *   - reducedInstallmentValue     ← fullInstallment × 0.7
 *   - redilutedInstallmentValue   ← derivado por déficit/meses restantes
 *   - installmentBeforeContemplation ← reduced ?: full (canônicos)
 *   - installmentAfterContemplation  ← última linha paga do schedule
 *
 * Resultado: card "Resultados", card "Composição", PDF e IA leem
 * EXATAMENTE o mesmo número — fim do drift estrutural.
 */
import type { SimulationResult } from '@/types/consortium';
import { REDUCED_INSTALLMENT_FACTOR } from '@/config/consortiumRates';
import type { MonthlyScheduleResult } from './monthlySchedule';

export interface ReconcileOptions {
  /** Quando true, mantém installmentAfterContemplation do legado (cenários sorteio que o schedule não cobre 1:1). */
  preserveContemplationInstallment?: boolean;
  /**
   * Onda A: valor da carta de crédito. Quando informado, a parcela canônica
   * é derivada exatamente como (credit + adminFee + reserveFund + insurance) / N.
   * Quando omitido, o valor é reconstruído a partir de `result.totalCost`
   * legado (compatível mas menos preciso quando há lance embutido).
   */
  creditValue?: number;
}

/**
 * Substitui campos de custo e PARCELA do `result` legado pelos valores reais
 * derivados do schedule mensal (fonte canônica institucional).
 */
export function reconcileWithSchedule(
  result: SimulationResult,
  schedule: MonthlyScheduleResult,
  termMonths: number,
  options: ReconcileOptions = {},
): SimulationResult {
  const safeTerm = Math.max(1, termMonths || 0);
  const totalCostReal = schedule.costWithInsurance;
  const insuranceTotalReal = schedule.totalInsurance;
  const monthlyInsuranceAvg = insuranceTotalReal / safeTerm;

  // ── Onda A: PARCELA CANÔNICA derivada do schedule ──
  // Estrutura "plano cheio" = crédito + adm + FR + seguro REAL (saldo decrescente).
  // Quando creditValue não é fornecido, reconstrói a partir do totalCost legado
  // (legacy.totalCost = credit + adminFee + reserveFund + legacyInsurance).
  const legacyBaseCostExclInsurance = Math.max(0, (result.totalCost ?? 0) - (result.insuranceTotal ?? 0));
  const creditFallback = Math.max(0, legacyBaseCostExclInsurance - (result.adminFee ?? 0) - (result.reserveFund ?? 0));
  const credit = options.creditValue ?? creditFallback;
  const baseCostExclInsurance = credit + (result.adminFee ?? 0) + (result.reserveFund ?? 0);
  const canonicalPlanTotal = baseCostExclInsurance + insuranceTotalReal;
  const fullInstallmentCanonical = canonicalPlanTotal / safeTerm;

  // Reduced (70%) / rediluted (déficit redistribuído).
  const reducedActive = (result.reducedInstallmentValue ?? 0) > 0;
  const reducedMonths = result.reducedInstallmentMonths ?? 0;
  const reducedInstallmentValueCanonical = reducedActive
    ? fullInstallmentCanonical * REDUCED_INSTALLMENT_FACTOR
    : 0;
  let redilutedInstallmentValueCanonical = 0;
  if (reducedActive) {
    const remaining = safeTerm - reducedMonths;
    if (remaining > 0) {
      const deficit = (fullInstallmentCanonical - reducedInstallmentValueCanonical) * reducedMonths;
      redilutedInstallmentValueCanonical = fullInstallmentCanonical + deficit / remaining;
    } else {
      redilutedInstallmentValueCanonical = fullInstallmentCanonical;
    }
  }

  // Parcela representativa do regime pós-contemplação.
  // ─────────────────────────────────────────────────────────────────────
  // BUGFIX (Onda Post-Contemplation Logic Audit, 2026-05-15):
  // Antes pegávamos a ÚLTIMA linha paga (`reverse().find(baseInstallment>0)`),
  // o que para o cenário `reduce-term` retornava a parcela RESIDUAL truncada
  // (último mês paga apenas o saldo remanescente, normalmente uma fração da
  // parcela cheia). Isso fazia o card "Cenário Pós-Contemplação" exibir
  // `reduce-term` com parcela MENOR que `reduce-installment`, invertendo
  // visualmente a lógica financeira ("reduzir prazo" deveria manter parcela
  // cheia, "reduzir parcela" deveria reduzir o valor mensal).
  //
  // Correção: quando existe regime 'post-bid', usar a PRIMEIRA linha desse
  // regime (parcela canônica do novo regime, antes de qualquer truncamento
  // residual). Para os demais regimes, mantém o último pagamento real.
  const postBidRows = schedule.rows.filter((r) => r.regime === 'post-bid' && r.baseInstallment > 0);
  let installmentFromSchedule: number;
  if (postBidRows.length > 0) {
    // Para 'reduce-installment': todas as post-bid são iguais (até reajuste anual).
    // Para 'reduce-term': a primeira post-bid = parcela cheia, última pode ser
    // residual; pegamos a representativa (máxima) para refletir o esforço real.
    installmentFromSchedule = postBidRows.reduce((max, r) => Math.max(max, r.payment), 0);
  } else {
    const lastPaidRow = [...schedule.rows].reverse().find((r) => r.baseInstallment > 0);
    installmentFromSchedule = lastPaidRow?.payment ?? result.installmentAfterContemplation;
  }

  // Parcela antes da contemplação reflete a parcela canônica.
  const installmentBeforeContemplationCanonical = reducedActive
    ? reducedInstallmentValueCanonical
    : fullInstallmentCanonical;

  // C2 aditivo (Onda Audit 2026-05-24): prêmio do primeiro mês com seguro ATIVO.
  // Modelo CAIXA operacional = prêmio fixo mensal. Origem canônica = primeira
  // linha do schedule com insurance > 0 (respeita `insuranceStartMonth`).
  const firstInsuredRow = schedule.rows.find((r) => r.insurance > 0);
  const firstInsurancePremium = firstInsuredRow?.insurance ?? 0;

  return {
    ...result,
    totalCost: totalCostReal,
    insuranceTotal: insuranceTotalReal,
    monthlyInsurance: monthlyInsuranceAvg,
    fullInstallment: fullInstallmentCanonical,
    reducedInstallmentValue: reducedInstallmentValueCanonical,
    redilutedInstallmentValue: redilutedInstallmentValueCanonical,
    installmentBeforeContemplation: installmentBeforeContemplationCanonical,
    installmentAfterContemplation: options.preserveContemplationInstallment
      ? result.installmentAfterContemplation
      : installmentFromSchedule,
    // C2/A3 aditivos (Onda Audit 2026-05-24) — sempre populados, nunca substituem
    // monthlyInsurance/netCreditValue. contractedCredit = carta original.
    contractedCredit: Math.max(0, credit),
    firstInsurancePremium: Math.max(0, firstInsurancePremium),
  };
}

/**
 * Custo efetivo do cliente, conforme o motor mensal (lance embutido NÃO entra como desembolso).
 * Use em PDFs, propostas e comparadores em vez de somar manualmente.
 */
export function getEffectiveClientCost(schedule: MonthlyScheduleResult): number {
  return Math.max(0, schedule.effectiveClientCost);
}
