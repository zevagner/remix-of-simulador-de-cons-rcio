/**
 * Engine canônica — TABELA PRICE.
 *
 * Sem TR: parcela fixa clássica.
 * Com TR: saldo é corrigido a cada mês ANTES dos juros e a parcela é
 * recalculada via PMT do saldo corrigido (metodologia padrão CAIXA
 * habitacional — garante convergência do saldo a 0).
 *
 * IMPORTANTE: matemática preservada byte-a-byte da implementação histórica
 * `calculateFinancingCost` (Onda B2 = unificação institucional, NÃO refator
 * matemático). Toda mudança aqui exige reanálise atuarial.
 */
import { annualToMonthlyRate, pricePmt } from '../investment';
import type { FinancingInstallment, FinancingScheduleInput, FinancingScheduleResult } from './types';

export function calculatePriceSchedule(input: FinancingScheduleInput): FinancingScheduleResult {
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

  const initialPmt = pricePmt(creditValue, monthlyRate, termMonths);

  const table: FinancingInstallment[] = [];
  let balance = creditValue;
  let totalMIP = 0;
  let totalDFI = 0;
  let totalInstallments = 0;
  const totalAdminFee = adminFeeMonthly * termMonths;

  for (let month = 1; month <= termMonths; month++) {
    if (hasTR) balance = balance * (1 + trRate);

    const remainingMonths = termMonths - month + 1;
    const monthlyPayment = hasTR
      ? pricePmt(balance, monthlyRate, remainingMonths)
      : initialPmt;

    const interest = balance * monthlyRate;
    const amortization = monthlyPayment - interest;
    const mip = balance * mipRate;
    const dfi = property * dfiRate;
    const payment = monthlyPayment + mip + dfi + adminFeeMonthly;

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

    totalMIP += mip;
    totalDFI += dfi;
    totalInstallments += monthlyPayment;
  }

  const monthlyPaymentReference = table[0]
    ? table[0].amortization + table[0].interest
    : initialPmt;

  return {
    monthlyPaymentReference,
    totalCost: totalInstallments,
    totalMIP,
    totalDFI,
    totalAdminFee,
    totalWithInsurance: totalInstallments + totalMIP + totalDFI + totalAdminFee,
    table,
  };
}
