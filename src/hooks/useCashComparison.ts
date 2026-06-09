import { useMemo } from 'react';
import {
  calculateIR,
  annualToMonthlyRate,
  compoundGrowth,
  futureValueOfSeries,
} from '@/core/finance';
import { CASH_LEVERAGE_MULTIPLIER } from '@/config/consortiumRates';
import { getEffectiveAssumptions } from '@/components/modules/investment/effectiveAssumptions';
import type { Assumptions } from '@/components/modules/investment/investmentTypes';

interface UseCashComparisonParams {
  assumptions: Assumptions;
  cashCdiRate: number;
  cashInvestmentRate: number;
  cashTermMonths: number;
  cashPropertyValue: number;
  cashEmbeddedBidPercent: number;
  cashFreeBidPercent: number;
  cashAdminFee: number;
  cashReserveFund: number;
  reinvestSurplus: boolean;
  insuranceEnabled: boolean;
  monthlySchedule: { totalInsurance: number } | null | undefined;
}

/**
 * Cálculo da comparação Cash (Compra à Vista vs Consórcio alavancado).
 * IDÊNTICO ao código original em InvestmentModule — apenas extraído.
 * NÃO altera matemática. Mantém todas as dependências de useMemo originais.
 */
export function useCashComparison(p: UseCashComparisonParams) {
  return useMemo(() => {
    const eff = getEffectiveAssumptions(
      p.assumptions,
      {
        cashCdiRate: p.cashCdiRate,
        cashInvestmentRate: p.cashInvestmentRate,
        cashTermMonths: p.cashTermMonths,
        cashPropertyValue: p.cashPropertyValue,
        cashEmbeddedBidPercent: p.cashEmbeddedBidPercent,
        cashFreeBidPercent: p.cashFreeBidPercent,
        cashAdminFee: p.cashAdminFee,
        cashReserveFund: p.cashReserveFund,
        reinvestSurplus: p.reinvestSurplus,
      },
      'cash',
    );
    const propertyValue = eff.cash.propertyValue;
    const embeddedPct = eff.cash.embeddedBidPercent;
    const freePct = eff.cash.freeBidPercent;
    const adminFee = eff.cash.adminFee;
    const reserveFund = eff.cash.reserveFund;
    const termMonths = eff.termMonths;
    const cdiRate = eff.cdiRate;
    const investmentRate = eff.cdiPercent;
    const reinvest = eff.cash.reinvestSurplus;

    const creditLetterValue = propertyValue * CASH_LEVERAGE_MULTIPLIER;
    const embeddedBidValue = creditLetterValue * (embeddedPct / 100);
    const freeBidValue = creditLetterValue * (freePct / 100);
    const totalBidValue = embeddedBidValue + freeBidValue;
    const capitalToInvest = propertyValue - freeBidValue;
    const totalFees = (adminFee + reserveFund) / 100;
    const totalConsortiumCost = creditLetterValue * (1 + totalFees);
    let totalInsuranceCost = 0;
    if (p.insuranceEnabled && p.monthlySchedule) {
      totalInsuranceCost = p.monthlySchedule.totalInsurance;
    }
    const totalCostAfterBid = totalConsortiumCost + totalInsuranceCost - totalBidValue;
    const monthlyInstallment = totalCostAfterBid / termMonths;
    const annualRate = (cdiRate / 100) * (investmentRate / 100);
    const monthlyRate = annualToMonthlyRate(annualRate);
    const monthlyYield = capitalToInvest * monthlyRate;
    const monthlyResult = monthlyYield - monthlyInstallment;

    const cashFinalPatrimony = propertyValue;
    const accumulatedInvestmentBase = compoundGrowth(capitalToInvest, monthlyRate, termMonths);

    const monthlyExcedent = monthlyYield - monthlyInstallment;
    let surplusAccumulatedValue = 0;
    if (monthlyExcedent > 0) {
      surplusAccumulatedValue = futureValueOfSeries(monthlyExcedent, monthlyRate, termMonths);
    }
    const accumulatedInvestmentWithReinvest = accumulatedInvestmentBase + surplusAccumulatedValue;
    const accumulatedInvestmentGross = reinvest ? accumulatedInvestmentWithReinvest : accumulatedInvestmentBase;

    const totalContributed = reinvest
      ? capitalToInvest + (monthlyExcedent > 0 ? monthlyExcedent * termMonths : 0)
      : capitalToInvest;
    const totalEarnings = accumulatedInvestmentGross - totalContributed;
    const { irAliquota, irValue } = calculateIR(totalEarnings, termMonths);
    const accumulatedInvestmentNet = accumulatedInvestmentGross - irValue;
    const consortiumFinalPatrimony = propertyValue + accumulatedInvestmentNet;
    const surplusAccumulated = accumulatedInvestmentWithReinvest - accumulatedInvestmentBase;
    const patrimonyDifference = consortiumFinalPatrimony - cashFinalPatrimony;
    const patrimonyDifferencePercent = cashFinalPatrimony > 0
      ? (patrimonyDifference / cashFinalPatrimony) * 100 : 0;

    return {
      creditLetterValue, embeddedBidValue, freeBidValue, totalBidValue,
      capitalToInvest, monthlyInstallment, monthlyYield, monthlyResult,
      cashFinalPatrimony, consortiumFinalPatrimony,
      accumulatedInvestmentGross, accumulatedInvestmentNet,
      irAliquota, irValue, surplusAccumulated,
      patrimonyDifference, patrimonyDifferencePercent,
    };
  }, [
    p.assumptions,
    p.cashPropertyValue, p.cashEmbeddedBidPercent, p.cashFreeBidPercent,
    p.cashTermMonths, p.cashAdminFee, p.cashReserveFund,
    p.cashInvestmentRate, p.cashCdiRate,
    p.insuranceEnabled, p.reinvestSurplus, p.monthlySchedule,
  ]);
}

export type CashComparisonResult = ReturnType<typeof useCashComparison>;
