/**
 * ════════════════════════════════════════════════════════════════════════════
 * core/finance/financing — ENGINE INSTITUCIONAL DE FINANCIAMENTO (Onda B2)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Fonte ÚNICA para qualquer cálculo de financiamento (Price/SAC/CET/saldo).
 *
 *   ✓ calculatePriceSchedule  — tabela Price + totais (com/sem TR).
 *   ✓ calculateSacSchedule    — tabela SAC + totais (com/sem TR).
 *   ✓ calculateFinancingCost  — orquestrador Price + SAC (interface legada).
 *   ✓ calculateCET            — Custo Efetivo Total via TIR mensal.
 *
 * Princípio: nenhum componente UI/PDF/IA recompõe parcela, juros, saldo
 * ou amortização. Todos consomem `FinancingResult`/`FinancingScheduleResult`.
 *
 * Equivalência de taxas: usar `annualToMonthlyRate` / `monthlyToAnnualRate`
 * de `@/core/finance` (engine de investimento). NÃO recriar em UI.
 * ════════════════════════════════════════════════════════════════════════════
 */
export { calculatePriceSchedule } from './price';
export { calculateSacSchedule } from './sac';
export { calculateCET, type CetInput, type CetResult } from './cet';
export type {
  FinancingInstallment,
  FinancingScheduleInput,
  FinancingScheduleResult,
  FinancingResult,
} from './types';

import { calculatePriceSchedule } from './price';
import { calculateSacSchedule } from './sac';
import type { FinancingResult } from './types';

/**
 * Orquestrador histórico — preserva a assinatura posicional original
 * para compatibilidade com `ComparatorModule` e `ProposalPdfModule`.
 *
 * Internamente delega para `calculatePriceSchedule` + `calculateSacSchedule`,
 * garantindo paridade de hipóteses entre as duas tabelas.
 */
export function calculateFinancingCost(
  creditValue: number,
  termMonths: number,
  annualInterestRate: number,
  mipMonthlyRate: number = 0.02,
  dfiMonthlyRate: number = 0.03,
  adminFeeMonthly: number = 25,
  propertyValue?: number,
  trMonthlyRate: number = 0,
): FinancingResult {
  const args = {
    creditValue,
    termMonths,
    annualInterestRate,
    mipMonthlyRate,
    dfiMonthlyRate,
    adminFeeMonthly,
    propertyValue,
    trMonthlyRate,
  };
  const price = calculatePriceSchedule(args);
  const sac = calculateSacSchedule(args);

  return {
    priceMonthlyPayment: price.monthlyPaymentReference,
    priceTotalCost: price.totalCost,
    priceTotalMIP: price.totalMIP,
    priceTotalDFI: price.totalDFI,
    priceTotalAdminFee: price.totalAdminFee,
    priceTotalWithInsurance: price.totalWithInsurance,
    priceTable: price.table,
    sacFirstPayment: sac.table[0]?.payment ?? 0,
    sacLastPayment: sac.table[sac.table.length - 1]?.payment ?? 0,
    sacTotalCost: sac.totalCost,
    sacTotalMIP: sac.totalMIP,
    sacTotalDFI: sac.totalDFI,
    sacTotalAdminFee: sac.totalAdminFee,
    sacTotalWithInsurance: sac.totalWithInsurance,
    sacTable: sac.table,
  };
}
