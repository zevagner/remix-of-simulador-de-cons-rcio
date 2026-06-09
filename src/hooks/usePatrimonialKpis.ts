/**
 * usePatrimonialKpis — hook consumer-only que deriva KPIs executivos
 * (TIR, ROI, Payback, Multiplicador, Capital Preservado) a partir
 * dos resultados já calculados pelo InvestmentResultsContext + SimulatorContext.
 *
 * Princípio: NÃO recalcula schedule/parcela/seguro. Apenas projeta KPIs
 * institucionais a partir de valores canônicos.
 *
 * Onda Patrimonial 1.
 */
import { useMemo } from 'react';
import { useSimulatorInput } from '@/components/modules/simulator/SimulatorContext';
import { useInvestmentResults } from '@/contexts/InvestmentResultsContext';
import {
  calculateTIR, calculateROI, calculatePayback,
  calculatePatrimonialMultiplier, calculatePreservedCapital,
} from '@/core/finance/investment/patrimonialKpis';

export interface PatrimonialKpis {
  /** TIR mensal (decimal). null se não disponível. */
  tirMonthly: number | null;
  /** TIR anualizada equivalente. */
  tirAnnual: number | null;
  /** ROI consolidado da estratégia vencedora (decimal). */
  roi: number | null;
  /** Payback em meses. null se não atinge equilíbrio dentro do horizonte. */
  paybackMonths: number | null;
  /** Multiplicador patrimonial: patrimônio controlado ÷ capital aportado. */
  multiplier: number | null;
  /** Capital líquido preservado após estratégia (R$). */
  preservedCapital: number;
  /** Patrimônio bruto controlado (R$). */
  controlledAsset: number;
  /** Capital próprio efetivamente aportado (R$). */
  ownCapitalInvested: number;
  /** Indica se há dados suficientes para exibir KPIs reais. */
  hasData: boolean;
}

const EMPTY: PatrimonialKpis = {
  tirMonthly: null, tirAnnual: null, roi: null, paybackMonths: null,
  multiplier: null, preservedCapital: 0, controlledAsset: 0,
  ownCapitalInvested: 0, hasData: false,
};

export function usePatrimonialKpis(): PatrimonialKpis {
  const { input } = useSimulatorInput();
  const { results } = useInvestmentResults();
  const calc = results?.calculations ?? null;

  return useMemo(() => {
    const credit = input?.creditValue ?? 0;
    if (!credit || credit <= 0) return EMPTY;

    const ownCapital =
      calc?.path1?.paidUntilContemplation
      ?? calc?.path2?.paidUntilContemplation
      ?? calc?.estimatedInstallment
      ?? 0;

    if (ownCapital <= 0) return EMPTY;

    const controlledAsset = credit;
    const totalPaid = calc?.totalPaid ?? ownCapital;

    const roi = calculateROI(controlledAsset, totalPaid);
    const multiplier = calculatePatrimonialMultiplier(controlledAsset, ownCapital);
    const preservedCapital = calculatePreservedCapital(credit, ownCapital);

    const installment = calc?.estimatedInstallment ?? 0;
    const contemplationMonth = results?.contemplationMonth
      ?? Math.max(1, Math.round(ownCapital / Math.max(installment, 1)));

    let tirMonthly: number | null = null;
    let paybackMonths: number | null = null;

    if (installment > 0 && contemplationMonth > 0) {
      const flow: number[] = [];
      for (let t = 0; t < contemplationMonth; t++) flow.push(-installment);
      flow.push(credit - installment);
      tirMonthly = calculateTIR(flow);
      paybackMonths = calculatePayback(flow);
    }

    const tirAnnual = tirMonthly !== null ? Math.pow(1 + tirMonthly, 12) - 1 : null;

    return {
      tirMonthly, tirAnnual, roi, paybackMonths, multiplier,
      preservedCapital, controlledAsset, ownCapitalInvested: ownCapital,
      hasData: true,
    };
  }, [input, results, calc]);
}
