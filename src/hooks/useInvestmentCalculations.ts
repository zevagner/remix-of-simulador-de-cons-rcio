/**
 * Hook: useInvestmentCalculations
 *
 * FONTE ÚNICA: `monthlySchedule` (motor atuarial mensal).
 * ────────────────────────────────────────────────────────
 * Esta camada NÃO recalcula o consórcio — ela CONSOME o schedule
 * já reconciliado pelo SimulatorContext e deriva todos os agregados
 * (totalPaid, paidUntilContemplation, parcela média, seguro, fluxo)
 * a partir das linhas mensais reais.
 *
 * ────────────────────────────────────────────────────────
 * PERFORMANCE — Onda Investment (Split por cenário)
 * ────────────────────────────────────────────────────────
 * Antes: um único `useMemo` gigante recalculava os 6 paths a cada
 * tick de slider, mesmo quando só um path dependia da mudança.
 *
 * Agora:
 *   1. Premissas explodidas em primitivos estáveis (assumptions vira
 *      múltiplas variáveis — dep array deixa de depender da identidade
 *      do objeto `assumptions`).
 *   2. `scheduleWithINPC` memoizado isoladamente.
 *   3. `rowDerived` (totalPaid, paidUntilContemplation, creditAtContemplation,
 *      estimatedInstallment) memoizado uma vez e compartilhado.
 *   4. Cada path em seu próprio `useMemo`, com deps mínimos.
 *   5. `calculations` final apenas referencia os 6 paths (custo O(1)).
 *
 * Resultado: mover slider de `propertyAppreciation` recalcula somente
 * path1 e path3; mover `cdiRate` recalcula somente path4 e path5; etc.
 *
 * Profiling opcional: `window.__INV_PROFILE__ = true` no DevTools loga
 * tempo de cada memo via `console.time`.
 *
 * Regras (inalteradas):
 *  - Zero chamadas a `calculateSimulation` / `calculateSimulationLegacy`.
 *  - Zero estimativa paralela de parcela.
 *  - Mesmo input no Simulator → mesmos números aqui.
 *  - Quando `monthlySchedule` não é fornecido (caller legado), retorna
 *    `hasData=false` e `calculations` zerado — sem fallback divergente.
 */
import { useMemo } from 'react';
import {
  calculateIR,
  calculateMonthlySchedule,
  getPrestamistaRate,
  annualToMonthlyRate,
  compoundGrowth,
  type MonthlyScheduleResult,
} from '@/core/finance';
import { SimulationInput, ContemplationType } from '@/types/consortium';
import { DEFAULT_INSURANCE_PERCENT, DEFAULT_PROPONENT_AGE } from '@/config/consortiumRates';
import type { Assumptions, InvestmentCalculations, PrevidenciaTurbinadaRow, PathResult } from '@/components/modules/investment/investmentTypes';

// ─── helpers ───
// Math de juros compostos: consumir SEMPRE de @/core/finance/investment.
// Proibido recriar annualToMonthlyRate / Math.pow inline neste hook.

/** Profiling opt-in (DEV apenas). Liga via console: `window.__INV_PROFILE__ = true`. */
function profile<T>(label: string, fn: () => T): T {
  if (import.meta.env.DEV && typeof window !== 'undefined' && (window as { __INV_PROFILE__?: boolean }).__INV_PROFILE__) {
    console.time(`[invCalc] ${label}`);
    const out = fn();
    console.timeEnd(`[invCalc] ${label}`);
    return out;
  }
  return fn();
}

const EMPTY_PATH = (): PathResult => ({ totalPaid: 0, finalResult: 0, absoluteGain: 0, percentGain: 0 });

// ─── hook ───

interface UseInvestmentCalculationsParams {
  simulatorInput: SimulationInput | null;
  /**
   * Schedule do SIMULADOR (snapshot, sem INPC) — usado como FALLBACK
   * de leitura informativa. Os Paths usam o `scheduleWithINPC` derivado
   * abaixo, que aplica o INPC apenas no contexto Análise.
   */
  monthlySchedule: MonthlyScheduleResult | null;
  adminFeeDiscount: number;
  insuranceEnabled: boolean;
  contemplationMonth: number;
  assumptions: Assumptions;
  // ─── Parâmetros de contemplação para gerar o schedule paralelo ───
  contemplated?: boolean;
  contemplationType?: ContemplationType;
  postLanceChoice?: 'reduce-installment' | 'reduce-term';
}

export function useInvestmentCalculations({
  simulatorInput,
  monthlySchedule,
  adminFeeDiscount,
  insuranceEnabled,
  contemplationMonth,
  assumptions,
  contemplated = false,
  contemplationType = 'none',
  postLanceChoice = 'reduce-installment',
}: UseInvestmentCalculationsParams) {
  // ─── Inputs explodidos em primitivos (deps estáveis) ───
  const creditValue = simulatorInput?.creditValue ?? 0;
  const termMonths = simulatorInput?.termMonths ?? 0;
  const consortiumType = simulatorInput?.consortiumType ?? 'imobiliario';
  const adminFeePercent = simulatorInput?.adminFeePercent ?? 0;
  const reserveFundPercent = simulatorInput?.reserveFundPercent ?? 0;
  const insurancePercent = simulatorInput?.insurancePercent ?? DEFAULT_INSURANCE_PERCENT;
  const proponentAge = simulatorInput?.proponentAge ?? DEFAULT_PROPONENT_AGE;
  const reducedInstallment = simulatorInput?.reducedInstallment ?? false;
  const freeBidValue = simulatorInput?.freeBidValue ?? 0;
  const embeddedBidValue = simulatorInput?.embeddedBidValue ?? 0;

  // safeInput memoizado a partir dos primitivos — preserva contrato externo
  // mas estabiliza identidade quando o objeto upstream é recriado sem mudanças.
  const safeInput: SimulationInput = useMemo(() => ({
    creditValue, termMonths, consortiumType, adminFeePercent,
    reserveFundPercent, insurancePercent, proponentAge,
    reducedInstallment, freeBidValue, embeddedBidValue,
  }), [
    creditValue, termMonths, consortiumType, adminFeePercent,
    reserveFundPercent, insurancePercent, proponentAge,
    reducedInstallment, freeBidValue, embeddedBidValue,
  ]);

  // ─── Premissas explodidas (deps estáveis) ───
  const propertyAppreciation = assumptions.propertyAppreciation;
  const rentalYield = assumptions.rentalYield;
  const analysisMonths = assumptions.analysisMonths;
  const discountOnSale = assumptions.discountOnSale;
  const agioOnSale = assumptions.agioOnSale;
  const tipoVendaCarta = assumptions.tipoVendaCarta;
  const contemplationMonthOverride = assumptions.contemplationMonthOverride;
  const previdenciaTermMonths = assumptions.previdenciaTermMonths;
  const previdenciaINPC = assumptions.previdenciaINPC;
  const cdiRate = assumptions.cdiRate;
  const cdiPercent = assumptions.cdiPercent;
  const inpcAnnualPercent = assumptions.inpcAnnualPercent || 0;

  const hasData =
    creditValue > 0 &&
    termMonths > 0 &&
    !!monthlySchedule &&
    monthlySchedule.rows.length > 0;

  // Mantidos para compatibilidade com props que ainda exibem essas premissas
  // como referência informativa (o motor mensal já as consome internamente).
  const effectiveAdminFeePercent = useMemo(
    () => Math.max(0, adminFeePercent - (adminFeePercent * adminFeeDiscount / 100)),
    [adminFeePercent, adminFeeDiscount],
  );
  const effectiveInsurancePercent = insuranceEnabled ? getPrestamistaRate() * 100 : 0;

  // ─── SCHEDULE PARALELO COM INPC (memoizado isoladamente) ───
  const scheduleWithINPC = useMemo<MonthlyScheduleResult | null>(() => {
    if (!hasData) return null;
    return profile('scheduleWithINPC', () => calculateMonthlySchedule({
      sim: safeInput,
      contemplated,
      contemplationType,
      contemplationMonth,
      postLanceChoice,
      annualAdjustmentPercent: inpcAnnualPercent,
    }));
  }, [hasData, safeInput, contemplated, contemplationType, contemplationMonth, postLanceChoice, inpcAnnualPercent]);

  // Schedule efetivo + linhas usadas pelos paths INPC-aware.
  const adjustedSchedule = useMemo<MonthlyScheduleResult | null>(() => {
    if (!hasData || !monthlySchedule) return null;
    if (scheduleWithINPC && scheduleWithINPC.rows.length > 0) return scheduleWithINPC;
    return monthlySchedule;
  }, [hasData, monthlySchedule, scheduleWithINPC]);

  // ─── Derivados de rows (compartilhados entre paths) ───
  const rowDerived = useMemo(() => {
    if (!adjustedSchedule) {
      return {
        rows: [] as MonthlyScheduleResult['rows'],
        totalPaid: 0,
        estimatedInstallment: 0,
        paidUntilContemplation: 0,
        creditAtContemplation: 0,
        insurance: 0,
      };
    }
    return profile('rowDerived', () => {
      const rows = adjustedSchedule.rows;
      const totalPaid = adjustedSchedule.effectiveClientCost;
      const estimatedInstallment = termMonths > 0 ? adjustedSchedule.costWithInsurance / termMonths : 0;

      const cmClamp = Math.max(0, Math.min(contemplationMonthOverride, rows.length));
      let paidUntilContemplation = 0;
      for (let i = 0; i < cmClamp; i++) paidUntilContemplation += rows[i].payment;

      const contemplationIdx = Math.max(0, Math.min(contemplationMonthOverride - 1, rows.length - 1));
      const creditAtContemplation = rows[contemplationIdx]?.creditLetterValue ?? creditValue;

      return {
        rows,
        totalPaid,
        estimatedInstallment,
        paidUntilContemplation,
        creditAtContemplation,
        insurance: adjustedSchedule.totalInsurance,
      };
    });
  }, [adjustedSchedule, termMonths, contemplationMonthOverride, creditValue]);

  // Componentes brutos — referência exibida em telas/resumos
  const adminFee = useMemo(() => creditValue * (effectiveAdminFeePercent / 100), [creditValue, effectiveAdminFeePercent]);
  const reserveFund = useMemo(() => creditValue * (reserveFundPercent / 100), [creditValue, reserveFundPercent]);

  // CDI efetivo — compartilhado por path4 e path5
  const cdiDerived = useMemo(() => {
    const baseCdiAnnual = cdiRate / 100;
    const effectiveCdiAnnual = (cdiPercent / 100) * baseCdiAnnual;
    const monthlyEffectiveCdiRate = annualToMonthlyRate(effectiveCdiAnnual);
    const totalMonths = Math.max(analysisMonths, termMonths);
    const monthsAfterContemplation = Math.max(0, totalMonths - contemplationMonthOverride);
    const yearsFromContemplation = (analysisMonths / 12) - (contemplationMonthOverride / 12);
    return { monthlyEffectiveCdiRate, monthsAfterContemplation, yearsFromContemplation };
  }, [cdiRate, cdiPercent, analysisMonths, termMonths, contemplationMonthOverride]);

  // ─── PATH 1 — Compra Tradicional ───
  const path1 = useMemo<InvestmentCalculations['path1']>(() => {
    if (!hasData) return EMPTY_PATH();
    return profile('path1', () => {
      const { creditAtContemplation, totalPaid } = rowDerived;
      const { yearsFromContemplation } = cdiDerived;
      const propertyFinalValue = compoundGrowth(creditAtContemplation, propertyAppreciation / 100, Math.max(0, yearsFromContemplation));
      return {
        finalResult: propertyFinalValue,
        totalPaid,
        absoluteGain: propertyFinalValue - totalPaid,
        percentGain: totalPaid > 0 ? ((propertyFinalValue - totalPaid) / totalPaid) * 100 : 0,
      };
    });
  }, [hasData, rowDerived, cdiDerived, propertyAppreciation]);

  // ─── PATH 2 — Venda da Cota ───
  const path2 = useMemo<InvestmentCalculations['path2']>(() => {
    if (!hasData) {
      return { ...EMPTY_PATH(), paidUntilContemplation: 0, tipoVenda: tipoVendaCarta, breakevenMonth: null };
    }
    return profile('path2', () => {
      const { creditAtContemplation, paidUntilContemplation, rows } = rowDerived;
      const saleValue = tipoVendaCarta === 'carta-contemplada'
        ? creditAtContemplation * (agioOnSale / 100)
        : creditAtContemplation * (1 - discountOnSale / 100);

      let saleBreakevenMonth: number | null = null;
      if (saleValue > 0) {
        let accumulated = 0;
        for (let m = 0; m < rows.length; m++) {
          accumulated += rows[m].payment;
          if (accumulated >= saleValue) { saleBreakevenMonth = m + 1; break; }
        }
      }

      return {
        finalResult: saleValue,
        totalPaid: paidUntilContemplation,
        paidUntilContemplation,
        absoluteGain: saleValue - paidUntilContemplation,
        percentGain: paidUntilContemplation > 0 ? ((saleValue - paidUntilContemplation) / paidUntilContemplation) * 100 : 0,
        tipoVenda: tipoVendaCarta,
        breakevenMonth: saleBreakevenMonth,
      };
    });
  }, [hasData, rowDerived, tipoVendaCarta, agioOnSale, discountOnSale]);

  // ─── PATH 3 — Locação ───
  const path3 = useMemo<InvestmentCalculations['path3']>(() => {
    if (!hasData) return { ...EMPTY_PATH(), monthlyRent: 0, totalRentIncome: 0 };
    return profile('path3', () => {
      const { creditAtContemplation, totalPaid } = rowDerived;
      const { yearsFromContemplation } = cdiDerived;
      const propertyAnnualRate = propertyAppreciation / 100;
      const yieldRate = rentalYield / 100;
      let totalRentIncome = 0;
      for (let m = contemplationMonthOverride; m < analysisMonths; m++) {
        const yearsFromContempForRent = (m - contemplationMonthOverride) / 12;
        const propertyValueAtMonth = compoundGrowth(creditAtContemplation, propertyAnnualRate, yearsFromContempForRent);
        totalRentIncome += propertyValueAtMonth * yieldRate;
      }
      const monthlyRent = creditAtContemplation * yieldRate;
      const propertyValueAtEnd = compoundGrowth(creditAtContemplation, propertyAnnualRate, Math.max(0, yearsFromContemplation));
      const finalResult = propertyValueAtEnd + totalRentIncome;
      return {
        finalResult,
        totalPaid,
        absoluteGain: finalResult - totalPaid,
        percentGain: totalPaid > 0 ? ((finalResult - totalPaid) / totalPaid) * 100 : 0,
        monthlyRent,
        totalRentIncome,
      };
    });
  }, [hasData, rowDerived, cdiDerived, propertyAppreciation, rentalYield, contemplationMonthOverride, analysisMonths]);

  // ─── PATH 4 — Investimento Tradicional ───
  // Usa schedule do SIMULADOR (snapshot nominal) — não o INPC.
  const path4 = useMemo<InvestmentCalculations['path4']>(() => {
    if (!hasData || !monthlySchedule) {
      return { ...EMPTY_PATH(), grossResult: 0, rendimento: 0, irAliquota: 0, irValue: 0 };
    }
    return profile('path4', () => {
      const baseRows = monthlySchedule.rows;
      const { monthlyEffectiveCdiRate } = cdiDerived;
      let path4Gross = 0;
      for (let m = 0; m < baseRows.length; m++) {
        const monthsRemaining = analysisMonths - m;
        if (monthsRemaining <= 0) continue;
        path4Gross += compoundGrowth(baseRows[m].payment, monthlyEffectiveCdiRate, monthsRemaining);
      }
      const path4TotalPaid = monthlySchedule.effectiveClientCost;
      const path4Rendimento = path4Gross - path4TotalPaid;
      const path4IRCalc = calculateIR(path4Rendimento, analysisMonths);
      const path4Net = path4Gross - path4IRCalc.irValue;
      return {
        finalResult: path4Net,
        grossResult: path4Gross,
        totalPaid: path4TotalPaid,
        rendimento: path4Rendimento,
        irAliquota: path4IRCalc.irRate,
        irValue: path4IRCalc.irValue,
        absoluteGain: path4Net - path4TotalPaid,
        percentGain: path4TotalPaid > 0 ? ((path4Net - path4TotalPaid) / path4TotalPaid) * 100 : 0,
      };
    });
  }, [hasData, monthlySchedule, cdiDerived, analysisMonths]);

  // ─── PATH 5 — Contemplação + Aplicação ───
  const path5 = useMemo<InvestmentCalculations['path5']>(() => {
    if (!hasData) {
      return { ...EMPTY_PATH(), grossResult: 0, rendimento: 0, irAliquota: 0, irValue: 0 };
    }
    return profile('path5', () => {
      const { creditAtContemplation, totalPaid } = rowDerived;
      const { monthlyEffectiveCdiRate, monthsAfterContemplation } = cdiDerived;
      const embeddedBid = Math.min(embeddedBidValue || 0, creditAtContemplation);
      const creditNetApplied = Math.max(0, creditAtContemplation - embeddedBid);
      const creditAppliedGross = compoundGrowth(creditNetApplied, monthlyEffectiveCdiRate, monthsAfterContemplation);
      const path5Rendimento = creditAppliedGross - creditNetApplied;
      const path5IRCalc = calculateIR(path5Rendimento, monthsAfterContemplation);
      const path5Net = creditAppliedGross - path5IRCalc.irValue;
      return {
        finalResult: path5Net,
        grossResult: creditAppliedGross,
        totalPaid,
        rendimento: path5Rendimento,
        irAliquota: path5IRCalc.irRate,
        irValue: path5IRCalc.irValue,
        absoluteGain: path5Net - totalPaid,
        percentGain: totalPaid > 0 ? ((path5Net - totalPaid) / totalPaid) * 100 : 0,
      };
    });
  }, [hasData, rowDerived, cdiDerived, embeddedBidValue]);

  // ─── PATH 6 — Previdência Turbinada ───
  const path6 = useMemo<InvestmentCalculations['path6']>(() => {
    if (!hasData || !monthlySchedule) {
      return { ...EMPTY_PATH(), finalCreditLetter: 0, table: [] };
    }
    return profile('path6', () => {
      const baseRows = monthlySchedule.rows;
      const inccAnnual = previdenciaINPC / 100;
      const monthlyInccRate = annualToMonthlyRate(inccAnnual);
      const previdenciaTable: PrevidenciaTurbinadaRow[] = [];
      let previdenciaAccumulatedPaid = 0;
      for (let month = 1; month <= previdenciaTermMonths; month++) {
        const idx = month - 1;
        const realPayment = idx < baseRows.length ? baseRows[idx].payment : 0;
        const correctedPayment = compoundGrowth(realPayment, monthlyInccRate, month);
        const creditLetterCorrected = compoundGrowth(creditValue, monthlyInccRate, month);
        previdenciaAccumulatedPaid += correctedPayment;
        previdenciaTable.push({ month, creditLetterCorrected, monthlyPayment: correctedPayment, accumulatedPaid: previdenciaAccumulatedPaid });
      }
      const previdenciaTotalPaid = previdenciaAccumulatedPaid;
      const finalCreditLetter = previdenciaTable[previdenciaTable.length - 1]?.creditLetterCorrected || creditValue;
      const path6AbsoluteGain = finalCreditLetter - previdenciaTotalPaid;
      const path6PercentGain = previdenciaTotalPaid > 0 ? ((path6AbsoluteGain / previdenciaTotalPaid) * 100) : 0;
      return {
        totalPaid: previdenciaTotalPaid,
        finalResult: finalCreditLetter,
        finalCreditLetter,
        absoluteGain: path6AbsoluteGain,
        percentGain: path6PercentGain,
        table: previdenciaTable,
      };
    });
  }, [hasData, monthlySchedule, previdenciaINPC, previdenciaTermMonths, creditValue]);

  // ─── Composição final (custo O(1): só reagrupa referências) ───
  const calculations: InvestmentCalculations = useMemo(() => ({
    totalPaid: rowDerived.totalPaid,
    paidUntilContemplation: rowDerived.paidUntilContemplation,
    estimatedInstallment: rowDerived.estimatedInstallment,
    adminFee,
    reserveFund,
    insurance: rowDerived.insurance,
    path1, path2, path3, path4, path5, path6,
  }), [rowDerived, adminFee, reserveFund, path1, path2, path3, path4, path5, path6]);

  return {
    safeInput,
    hasData,
    effectiveAdminFeePercent,
    effectiveInsurancePercent,
    calculations,
  };
}
