/**
 * Engine canônica — TABELA SAC.
 *
 * Sem TR: amortização constante = creditValue / termMonths.
 * Com TR: saldo é corrigido a cada mês e amortização recalculada como
 * saldo_corrigido / prazo_restante (regra padrão CAIXA — saldo→0).
 *
 * Matemática preservada byte-a-byte da implementação histórica.
 */
import { annualToMonthlyRate } from '../investment';
import type { FinancingInstallment, FinancingScheduleInput, FinancingScheduleResult } from './types';

export function calculateSacSchedule(input: FinancingScheduleInput): FinancingScheduleResult {
  const {
    creditValue,
    termMonths,
    annualInterestRate,
    mipMonthlyRate = 0.02,
    dfiMonthlyRate = 0.03,
    adminFeeMonthly = 25,
    propertyValue,
    trMonthlyRate = 0,
  } = input;

  if (termMonths <= 0) {
    return {
      monthlyPaymentReference: 0,
      totalCost: 0,
      totalMIP: 0,
      totalDFI: 0,
      totalAdminFee: 0,
      totalWithInsurance: 0,
      table: [],
    };
  }

  const monthlyRate = annualToMonthlyRate(annualInterestRate / 100);
  const mipRate = mipMonthlyRate / 100;
  const dfiRate = dfiMonthlyRate / 100;
  const trRate = Math.max(0, trMonthlyRate) / 100;
  const property = propertyValue ?? creditValue;
  const hasTR = trRate > 0;

  const initialAmortization = creditValue / termMonths;
  const table: FinancingInstallment[] = [];
  let balance = creditValue;
  let totalCost = 0;
  let totalMIP = 0;
  let totalDFI = 0;
  const totalAdminFee = adminFeeMonthly * termMonths;

  for (let month = 1; month <= termMonths; month++) {
    if (hasTR) balance = balance * (1 + trRate);

    const remainingMonths = termMonths - month + 1;
    const amortization = hasTR ? balance / remainingMonths : initialAmortization;

    const interest = balance * monthlyRate;
    const mip = balance * mipRate;
    const dfi = property * dfiRate;
    const payment = amortization + interest + mip + dfi + adminFeeMonthly;

    balance = Math.max(0, balance - amortization);

    table.push({
      month,
      amortization,
      interest,
      mip,
      dfi,
      adminFee: adminFeeMonthly,
      payment,
      balance,
    });

    totalCost += amortization + interest;
    totalMIP += mip;
    totalDFI += dfi;
  }

  const firstPayment = table[0]?.payment ?? 0;

  return {
    monthlyPaymentReference: firstPayment,
    totalCost,
    totalMIP,
    totalDFI,
    totalAdminFee,
    totalWithInsurance: totalCost + totalMIP + totalDFI + totalAdminFee,
    table,
  };
}
