/**
 * ════════════════════════════════════════════════════════════════════════════
 * core/finance/installments — Primitivas canônicas de parcela do consórcio
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Onda B3 — extrai a aritmética de bookkeeping do `calculateSimulation`
 * para um namespace institucional próprio. Estas funções NÃO contêm
 * matemática nova: são as fórmulas históricas (taxas sobre crédito,
 * parcela = total/N, fator reduzido, redilução por déficit) preservadas
 * byte-a-byte e expostas como primitivas auditáveis.
 *
 *   ✓ computeAdminFee, computeReserveFund   — bases de taxas
 *   ✓ computeFullInstallment                — parcela média = total/N
 *   ✓ computeReducedInstallment             — fator REDUCED_INSTALLMENT_FACTOR
 *   ✓ computeRedilutedInstallment           — redilui déficit pelos meses restantes
 *
 * Princípio: `calculateSimulation` orquestra; estas primitivas calculam.
 * UI/PDF/IA NÃO consome diretamente — consome `SimulationResult` reconciliado.
 * ════════════════════════════════════════════════════════════════════════════
 */
import { REDUCED_INSTALLMENT_FACTOR, MAX_REDUCED_INSTALLMENT_MONTHS } from '@/config/consortiumRates';
import type { ConsortiumType } from '@/types/consortium';

/** Divisão segura: 0 quando divisor inválido. */
export function safeDivide(a: number, b: number): number {
  if (!b || b === 0 || !isFinite(b)) return 0;
  const r = a / b;
  return isFinite(r) ? r : 0;
}

/** Taxa administrativa total = creditValue × adminFeePercent%. */
export function computeAdminFee(creditValue: number, adminFeePercent: number): number {
  return (creditValue * adminFeePercent) / 100;
}

/** Fundo de reserva total = creditValue × reserveFundPercent%. */
export function computeReserveFund(creditValue: number, reserveFundPercent: number): number {
  return (creditValue * reserveFundPercent) / 100;
}

/** Custo base (sem seguro) = crédito + adm + FR. */
export function computeBaseCost(creditValue: number, adminFee: number, reserveFund: number): number {
  return creditValue + adminFee + reserveFund;
}

/** Parcela cheia média = totalCost / termMonths. */
export function computeFullInstallment(totalCost: number, termMonths: number): number {
  return safeDivide(totalCost, termMonths);
}

/** Parcela reduzida = parcela cheia × REDUCED_INSTALLMENT_FACTOR (0 se desligada). */
export function computeReducedInstallment(fullInstallment: number, enabled: boolean): number {
  return enabled ? fullInstallment * REDUCED_INSTALLMENT_FACTOR : 0;
}

/** Meses oficiais com parcela reduzida por tipo. */
export function getReducedInstallmentMonths(
  type: ConsortiumType,
  enabled: boolean,
): number {
  return enabled ? MAX_REDUCED_INSTALLMENT_MONTHS[type] : 0;
}

/**
 * Parcela rediluída — distribui o déficit acumulado nos meses reduzidos
 * pelos meses restantes do plano. Fórmula histórica preservada.
 */
export function computeRedilutedInstallment(
  fullInstallment: number,
  reducedInstallmentValue: number,
  reducedInstallmentMonths: number,
  termMonths: number,
): number {
  if (!reducedInstallmentMonths || reducedInstallmentMonths >= termMonths) {
    return reducedInstallmentMonths >= termMonths ? fullInstallment : 0;
  }
  const remainingMonths = termMonths - reducedInstallmentMonths;
  if (remainingMonths <= 0) return fullInstallment;
  const deficitPerMonth = fullInstallment - reducedInstallmentValue;
  const totalDeficit = deficitPerMonth * reducedInstallmentMonths;
  const additionalPerMonth = safeDivide(totalDeficit, remainingMonths);
  return fullInstallment + additionalPerMonth;
}

export { REDUCED_INSTALLMENT_FACTOR, MAX_REDUCED_INSTALLMENT_MONTHS };
