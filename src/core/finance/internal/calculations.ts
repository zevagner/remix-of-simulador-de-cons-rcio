/**
 * ════════════════════════════════════════════════════════════════════════════
 * FONTE DE VERDADE FINANCEIRA — LEIA ANTES DE EDITAR
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `monthlySchedule` (src/utils/calculations/monthlySchedule.ts) é a ÚNICA
 * fonte de verdade para valores financeiros exibidos ao cliente
 * (custo total, seguro, custo efetivo, parcela pós-contemplação).
 *
 * `calculateSimulation` abaixo permanece como motor agregado LEGADO usado
 * apenas dentro do `SimulatorContext` para alimentar o `reconcileWithSchedule`.
 * NÃO chame diretamente em UI, PDF, hooks de módulo ou IA — use o contexto
 * (`useSimulatorContext().result` / `.monthlySchedule`).
 *
 * Casos paramétricos legítimos (cenários alternativos com taxas/idade
 * diferentes da sessão atual — ex.: Comparator, Investment, QuickSale)
 * devem importar o alias `calculateSimulationLegacy` para sinalizar a
 * intenção e evitar regressão silenciosa.
 * ════════════════════════════════════════════════════════════════════════════
 */
import { SimulationInput, SimulationResult, ContemplationType, PostContemplationChoice } from '@/types/consortium';
import { MAX_REDUCED_INSTALLMENT_MONTHS, REDUCED_INSTALLMENT_FACTOR } from '@/config/consortiumRates';

// Flag interna global usada por SimulatorContext / decisionEngine / testes
// para silenciar o warning de uso direto de `calculateSimulation`.
// Declarada como `var` para que `globalThis.__calcSimAllowedCaller`
// seja propriamente tipada em todo o projeto, eliminando `(globalThis as any)`.
declare global {
  // eslint-disable-next-line no-var
  var __calcSimAllowedCaller: boolean | undefined;
}
import {
  computeAdminFee,
  computeReserveFund,
  computeBaseCost,
  computeFullInstallment,
  computeReducedInstallment,
  computeRedilutedInstallment,
  getReducedInstallmentMonths,
} from '../installments';
import { calculateOperationalPrestamistaForType } from '../prestamista';

import { logger } from '@/utils/logger';
/**
 * Divisão segura: retorna 0 se divisor for 0, NaN ou Infinity.
 */
function safeDivide(a: number, b: number): number {
  if (!b || b === 0 || !isFinite(b)) return 0;
  const result = a / b;
  return isFinite(result) ? result : 0;
}

/**
 * Deriva o tipo de contemplação a partir do estado da simulação.
 */
export function deriveContemplationType(
  contemplated: boolean,
  freeBidValue: number,
  embeddedBidValue: number,
): ContemplationType {
  if ((freeBidValue + embeddedBidValue) > 0 && contemplated) return 'lance';
  if (contemplated) return 'sorteio';
  return 'none';
}

// Warning único em dev quando `calculateSimulation` é chamado fora do
// SimulatorContext / testes / decisionEngine. Não bloqueia execução.
let __calcSimDirectWarned = false;
function warnDirectUseOnce() {
  if (__calcSimDirectWarned) return;
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') return;
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD) return;
  __calcSimDirectWarned = true;
  // eslint-disable-next-line no-console
  logger.warn(
    '[calculations] ⚠️ calculateSimulation foi chamado diretamente. ' +
    'Use useSimulatorContext().result para a sessão atual, ou ' +
    'calculateSimulationLegacy para cenários paramétricos alternativos. ' +
    'Veja o cabeçalho de src/utils/calculations.ts.'
  );
}

/**
 * @deprecated Não use diretamente em UI/PDF/IA. Use `useSimulatorContext()`
 * para a sessão atual, ou importe `calculateSimulationLegacy` quando precisar
 * simular um cenário paramétrico alternativo (taxas/idade diferentes).
 *
 * Permanece exportado pois o `SimulatorContext` o utiliza internamente para
 * alimentar `reconcileWithSchedule` (motor mensal = fonte de verdade).
 */
export function calculateSimulation(
  input: SimulationInput,
  contemplated: boolean = false,
  postContemplationChoice: PostContemplationChoice = 'reduce-installment',
  monthsElapsed: number = 12
): SimulationResult {
  // Marcador interno: o SimulatorContext seta um flag global antes de chamar
  // para silenciar o warning. Mesma coisa para decisionEngine (auditoria).
  if (
    typeof globalThis !== 'undefined' &&
    !globalThis.__calcSimAllowedCaller
  ) {
    warnDirectUseOnce();
  }
  const {
    creditValue: rawCreditValue,
    termMonths,
    consortiumType,
    adminFeePercent,
    reserveFundPercent,
    insurancePercent,
    reducedInstallment: rawReducedInstallment,
    embeddedBidValue: rawEmbeddedBidValue,
    freeBidValue: rawFreeBidValue,
  } = input;

  // ═══════ PROTEÇÕES DE ENTRADA ═══════
  const creditValue = Math.max(0, rawCreditValue || 0);
  // A1 — freeBid clamped ao crédito (lance livre não pode exceder a carta)
  const freeBidValue = Math.min(Math.max(0, rawFreeBidValue || 0), creditValue);
  const safeEmbeddedBid = Math.min(Math.max(0, rawEmbeddedBidValue || 0), creditValue);
  const safeMonthsElapsed = Math.max(0, Math.min(monthsElapsed || 0, Math.max(termMonths - 1, 0)));
  // A2 — parcela reduzida só vale se houver janela de rediluição (prazo > janela).
  // Em prazos curtos, ignora silenciosamente — preserva convergência do saldo.
  const reducedInstallment =
    !!rawReducedInstallment &&
    (termMonths || 0) > (MAX_REDUCED_INSTALLMENT_MONTHS[consortiumType] ?? 80);

  const contemplationType = deriveContemplationType(contemplated, freeBidValue, safeEmbeddedBid);

  // Guard clause: termMonths inválido
  if (!termMonths || termMonths <= 0) {
    return {
      installmentBeforeContemplation: 0,
      installmentAfterContemplation: 0,
      netCreditValue: Math.max(0, creditValue - safeEmbeddedBid),
      adjustedCreditValue: Math.max(0, creditValue - safeEmbeddedBid),
      totalCost: 0,
      adminFee: 0,
      reserveFund: 0,
      insuranceTotal: 0,
      monthlyInsurance: 0,
      reducedInstallmentMonths: 0,
      remainingTermAfterContemplation: 0,
      debtAfterContemplation: 0,
      contemplationType,
      fullInstallment: 0,
      reducedInstallmentValue: 0,
      redilutedInstallmentValue: 0,
      contractedCredit: Math.max(0, creditValue),
      firstInsurancePremium: 0,
    };
  }

  // ═══════ TAXAS BASE (Onda B3 — primitivas canônicas) ═══════
  const adminFee = computeAdminFee(creditValue, adminFeePercent);
  const reserveFund = computeReserveFund(creditValue, reserveFundPercent);
  const baseCost = computeBaseCost(creditValue, adminFee, reserveFund);
  // ─── Seguro Prestamista OPERACIONAL V1 (Onda OP-V1) ───
  // Engine única: calculateOperationalPrestamistaForType (tabela por modalidade × prazo).
  // O `insurancePercent` legado serve APENAS como TOGGLE (>0 = on, =0 = off).
  const insuranceEnabledLegacy = insurancePercent > 0;
  const op = calculateOperationalPrestamistaForType({
    creditValue,
    adminFeeTotal: adminFee,
    reserveFundTotal: reserveFund,
    termMonths,
    consortiumType,
    enabled: insuranceEnabledLegacy,
  });
  const monthlyInsurance = op.monthlyPremium;
  const insuranceTotal = op.totalPremium;
  const netCreditValue = Math.max(0, creditValue - safeEmbeddedBid);
  const totalCost = baseCost + insuranceTotal;

  // ═══════ PARCELA BASE (primitiva canônica) ═══════
  const fullInstallment = computeFullInstallment(totalCost, termMonths);

  // ═══════ PARCELA REDUZIDA / REDILUÍDA (primitivas canônicas) ═══════
  const reducedInstallmentMonths = getReducedInstallmentMonths(consortiumType, !!reducedInstallment);
  const reducedInstallmentValue = computeReducedInstallment(fullInstallment, !!reducedInstallment);
  const redilutedInstallmentValue = reducedInstallment
    ? computeRedilutedInstallment(fullInstallment, reducedInstallmentValue, reducedInstallmentMonths, termMonths)
    : 0;
  const maxReducedMonths = reducedInstallmentMonths || MAX_REDUCED_INSTALLMENT_MONTHS[consortiumType];

  // Parcela antes da contemplação
  let installmentBeforeContemplation = fullInstallment;
  if (reducedInstallment) {
    installmentBeforeContemplation = reducedInstallmentValue;
  }

  // ═══════ RESULTADOS PÓS-CONTEMPLAÇÃO POR CENÁRIO ═══════
  let installmentAfterContemplation = fullInstallment;
  let remainingTermAfterContemplation = termMonths - safeMonthsElapsed;
  let debtAfterContemplation = 0;
  let adjustedCreditValue = netCreditValue;

  switch (contemplationType) {
    // ─── NÃO CONTEMPLADO ───
    case 'none': {
      if (reducedInstallment) {
        const amountPaidDuringReduced = reducedInstallmentValue * maxReducedMonths;
        const remainingDebtAfterReduced = totalCost - amountPaidDuringReduced;
        const remainingMonthsAfterReduced = termMonths - maxReducedMonths;

        debtAfterContemplation = Math.max(0, remainingDebtAfterReduced);

        if (remainingMonthsAfterReduced > 0) {
          installmentAfterContemplation = safeDivide(remainingDebtAfterReduced, remainingMonthsAfterReduced);
          remainingTermAfterContemplation = remainingMonthsAfterReduced;
        }
      }
      break;
    }

    // ─── CONTEMPLAÇÃO POR SORTEIO ───
    case 'sorteio': {
      let amountPaid: number;
      if (reducedInstallment) {
        const monthsWithReduced = Math.min(safeMonthsElapsed, maxReducedMonths);
        const monthsWithNormal = Math.max(0, safeMonthsElapsed - maxReducedMonths);
        amountPaid = (reducedInstallmentValue * monthsWithReduced) + (fullInstallment * monthsWithNormal);
      } else {
        amountPaid = fullInstallment * safeMonthsElapsed;
      }

      const remainingDebt = Math.max(0, totalCost - amountPaid);
      debtAfterContemplation = remainingDebt;
      remainingTermAfterContemplation = termMonths - safeMonthsElapsed;
      const safeRemainingTerm = Math.max(1, remainingTermAfterContemplation);

      if (reducedInstallment) {
        if (postContemplationChoice === 'keep-reduced-credit-adjusted') {
          const capacidadePagamentoRestante = reducedInstallmentValue * safeRemainingTerm;
          const proporcao = remainingDebt > 0 ? capacidadePagamentoRestante / remainingDebt : 1;
          adjustedCreditValue = Math.max(0, creditValue * proporcao);
          installmentAfterContemplation = reducedInstallmentValue;
        } else {
          adjustedCreditValue = netCreditValue;
          installmentAfterContemplation = safeDivide(remainingDebt, safeRemainingTerm);
        }
      } else {
        adjustedCreditValue = netCreditValue;
        installmentAfterContemplation = safeDivide(remainingDebt, safeRemainingTerm);
      }
      break;
    }

    // ─── CONTEMPLAÇÃO POR LANCE ───
    case 'lance': {
      let amountPaid: number;
      if (reducedInstallment) {
        const monthsWithReduced = Math.min(safeMonthsElapsed, maxReducedMonths);
        const monthsWithNormal = Math.max(0, safeMonthsElapsed - maxReducedMonths);
        amountPaid = (reducedInstallmentValue * monthsWithReduced) + (fullInstallment * monthsWithNormal);
      } else {
        amountPaid = fullInstallment * safeMonthsElapsed;
      }

      const remainingDebt = Math.max(0, totalCost - amountPaid);
      const totalBid = freeBidValue + safeEmbeddedBid;
      const debtAfterBid = Math.max(0, remainingDebt - totalBid);
      debtAfterContemplation = debtAfterBid;
      adjustedCreditValue = netCreditValue;

      if (postContemplationChoice === 'reduce-term') {
        installmentAfterContemplation = fullInstallment;
        remainingTermAfterContemplation = fullInstallment > 0
          ? Math.ceil(safeDivide(debtAfterBid, fullInstallment))
          : 0;
      } else {
        remainingTermAfterContemplation = termMonths - safeMonthsElapsed;
        const safeRemainingTerm = Math.max(1, remainingTermAfterContemplation);
        installmentAfterContemplation = safeDivide(debtAfterBid, safeRemainingTerm);
      }
      break;
    }
  }

  // ═══════ PROTEÇÃO FINAL — garantir não-negatividade ═══════
  return {
    installmentBeforeContemplation: Math.max(0, installmentBeforeContemplation),
    installmentAfterContemplation: Math.max(0, installmentAfterContemplation),
    netCreditValue: Math.max(0, netCreditValue),
    adjustedCreditValue: Math.max(0, adjustedCreditValue),
    totalCost: Math.max(0, totalCost),
    adminFee: Math.max(0, adminFee),
    reserveFund: Math.max(0, reserveFund),
    insuranceTotal: Math.max(0, insuranceTotal),
    monthlyInsurance: Math.max(0, monthlyInsurance),
    reducedInstallmentMonths,
    remainingTermAfterContemplation: Math.max(0, remainingTermAfterContemplation),
    debtAfterContemplation: Math.max(0, debtAfterContemplation),
    contemplationType,
    fullInstallment: Math.max(0, fullInstallment),
    reducedInstallmentValue: Math.max(0, reducedInstallmentValue),
    redilutedInstallmentValue: Math.max(0, redilutedInstallmentValue),
    // C2/A3 aditivos (Onda Audit 2026-05-24) — não alteram nenhum campo existente.
    contractedCredit: Math.max(0, creditValue),
    firstInsurancePremium: Math.max(0, monthlyInsurance),
  };
}

/**
 * Alias explícito para `calculateSimulation` destinado a call-sites legítimos
 * que precisam simular cenários paramétricos ALTERNATIVOS à sessão atual
 * (ex.: Comparator com taxas distintas, InvestmentModule com MIP por idade,
 * QuickSaleMode sem sessão prévia).
 *
 * Usar este alias documenta a intenção e silencia o warning de uso direto.
 * Para a sessão atual do simulador, use `useSimulatorContext().result`.
 *
 * @deprecated A médio prazo, deve ser substituído por uma fachada que rode
 * o motor mensal e retorne valores reconciliados.
 */
export function calculateSimulationLegacy(
  input: SimulationInput,
  contemplated: boolean = false,
  postContemplationChoice: PostContemplationChoice = 'reduce-installment',
  monthsElapsed: number = 12,
): SimulationResult {
  const prev = globalThis.__calcSimAllowedCaller;
  globalThis.__calcSimAllowedCaller = true;
  try {
    return calculateSimulation(input, contemplated, postContemplationChoice, monthsElapsed);
  } finally {
    globalThis.__calcSimAllowedCaller = prev;
  }
}

// ─── Engine de financiamento (Onda B2) ───
// Toda matemática de Price/SAC/CET vive em `core/finance/financing/`.
// Este módulo apenas re-exporta para preservar consumers históricos
// (`@/core/finance` fachada e callsites legados).
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
} from '../financing';

// Formatadores movidos para src/utils/format.ts (fonte única).
// Re-exportados aqui para preservar os ~44 imports existentes.
export { formatCurrency, formatPercent } from '@/utils/format';
