import { Building2, Car, Truck } from 'lucide-react';
import { ConsortiumType, CONSORTIUM_TYPE_LABELS, type SimulationInput } from '@/types/consortium';
import {
  DEFAULT_ADMIN_FEE,
  DEFAULT_RESERVE_FUND,
  DEFAULT_PROPONENT_AGE,
} from '@/config/consortiumRates';
import { PRESTAMISTA_RATE_CURRENT } from '@/core/finance/prestamista';
import { calculateSimulation, deriveContemplationType } from '@/core/finance/internal/calculations';
import { calculateMonthlySchedule } from '@/core/finance/internal/monthlySchedule';
import { reconcileWithSchedule } from '@/core/finance/internal/reconcile';
import type { CreditCard, CardResult } from './structuredOpsTypes';

export const typeLabels = CONSORTIUM_TYPE_LABELS;

export const typeIcons: Record<ConsortiumType, React.ElementType> = {
  imobiliario: Building2,
  auto: Car,
  pesados: Truck,
};

/**
 * Limites máximos de Lance Embutido por tipo de consórcio (regra CAIXA).
 * - Imobiliário: 50%
 * - Auto / Pesados: 30%
 */
export const MAX_EMBEDDED_BID_BY_TYPE: Record<ConsortiumType, number> = {
  imobiliario: 50,
  auto: 30,
  pesados: 30,
};

export function getMaxEmbeddedBid(type: ConsortiumType): number {
  return MAX_EMBEDDED_BID_BY_TYPE[type] ?? 30;
}

export const createEmptyCard = (): CreditCard => ({
  id: crypto.randomUUID(),
  consortiumType: 'imobiliario',
  personType: 'PF',
  creditValue: 300000,
  termMonths: 180,
  adminFeePercent: DEFAULT_ADMIN_FEE['imobiliario'],
  reserveFundPercent: DEFAULT_RESERVE_FUND['imobiliario'],
  proponentAge: DEFAULT_PROPONENT_AGE,
  insuranceEnabled: true,
  embeddedBidPercent: 0,
  freeBidType: 'percent',
  freeBidValue: 0,
  freeBidPercent: 47,
  quantity: 1,
});

/**
 * Correção C1 (Auditoria 2026-05-24) — StructuredOps usa motor canônico.
 *
 * Substitui a matemática inline anterior (parcela base / lance / seguro)
 * pelas chamadas oficiais `calculateMonthlySchedule` + `reconcileWithSchedule`.
 * Toda a estrutura financeira passa a vir da MESMA fonte da verdade usada
 * pelo Simulador, Comparador e Investimento — fim do drift estrutural.
 *
 * Mapping CreditCard → SimulationInput:
 *  - embeddedBidPercent → embeddedBidValue (% sobre carta)
 *  - freeBidType/percent/value → freeBidValue (R$ efetivo)
 *  - insuranceEnabled → toggle via insurancePercent (>0 ativa; valor real
 *    é resolvido pela engine operacional CAIXA via `calculateSimulation`).
 *  - personType/proponentAge → repassados ao motor canônico.
 *
 * Premissas de StructuredOps (mantidas):
 *  - cada carta é tratada como CONTEMPLADA por LANCE no mês 1
 *    (mantém a semântica anterior de `remainingTerm = termMonths - 1`,
 *    agora derivada do schedule).
 *  - postLanceChoice = 'reduce-installment' (default operacional).
 */
export function calculateCardResult(card: CreditCard): CardResult {
  const {
    creditValue, termMonths, adminFeePercent, reserveFundPercent,
    insuranceEnabled, embeddedBidPercent,
    freeBidType, freeBidValue, freeBidPercent, quantity,
    personType = 'PF',
    proponentAge,
  } = card;

  // Guard: entradas inválidas (carta ou prazo zerado/negativo) — retorna
  // CardResult zerado e válido para evitar Infinity/NaN do motor canônico.
  if (creditValue <= 0 || termMonths <= 0) {
    const safeQty = quantity ?? 1;
    return {
      id: card.id,
      consortiumType: card.consortiumType,
      creditValue: Math.max(0, creditValue),
      totalCreditValue: 0,
      quantity: safeQty,
      initialInstallment: 0,
      totalInitialInstallment: 0,
      installmentAfterContemplation: 0,
      totalInstallmentAfterContemplation: 0,
      totalPaid: 0,
      totalCost: 0,
      freeBidValue: 0,
      embeddedBidValue: 0,
      totalBid: 0,
      availableCredit: 0,
      adminFeeTotal: 0,
      reserveFundTotal: 0,
      insuranceTotal: 0,
    };
  }


  // Lances (R$) — derivados dos campos da CreditCard.
  const embeddedBidValue = (creditValue * embeddedBidPercent) / 100;
  const actualFreeBidValue = freeBidType === 'percent'
    ? (creditValue * freeBidPercent) / 100
    : freeBidValue;
  const totalBid = embeddedBidValue + actualFreeBidValue;

  const sim: SimulationInput = {
    creditValue,
    termMonths,
    consortiumType: card.consortiumType,
    adminFeePercent,
    reserveFundPercent,
    // Toggle do seguro (Onda 2 Prestamista): para desligar, basta zerar
    // `proponentAge` (motor mensal calcula `insuranceEnabled = PF && age>0`).
    insurancePercent: insuranceEnabled ? PRESTAMISTA_RATE_CURRENT * 100 : 0,
    proponentAge: insuranceEnabled ? (proponentAge ?? DEFAULT_PROPONENT_AGE) : 0,
    reducedInstallment: false,
    freeBidValue: actualFreeBidValue,
    embeddedBidValue,
    personType,
  };

  // StructuredOps modela cartas como contempladas por lance no mês 1.
  const contemplated = true;
  const contemplationMonth = 1;
  const postLanceChoice: 'reduce-installment' | 'reduce-term' = 'reduce-installment';
  const contemplationType = deriveContemplationType(contemplated, actualFreeBidValue, embeddedBidValue);

  const schedule = calculateMonthlySchedule({
    sim,
    contemplated,
    contemplationType,
    contemplationMonth,
    postLanceChoice,
  });

  // Silencia o warning interno do motor legado (call-site legítimo do pipeline canônico).
  globalThis.__calcSimAllowedCaller = true;
  let legacy;
  try {
    legacy = calculateSimulation(sim, contemplated, postLanceChoice, contemplationMonth);
  } finally {
    globalThis.__calcSimAllowedCaller = false;
  }
  const result = reconcileWithSchedule(legacy, schedule, termMonths, { creditValue });

  const safeQty = quantity ?? 1;
  const availableCredit = result.netCreditValue;

  return {
    id: card.id,
    consortiumType: card.consortiumType,
    creditValue,
    totalCreditValue: result.contractedCredit * safeQty,
    quantity: safeQty,
    initialInstallment: result.fullInstallment,
    totalInitialInstallment: result.fullInstallment * safeQty,
    installmentAfterContemplation: result.installmentAfterContemplation,
    totalInstallmentAfterContemplation: result.installmentAfterContemplation * safeQty,
    totalPaid: result.totalCost * safeQty,
    totalCost: result.totalCost * safeQty,
    freeBidValue: actualFreeBidValue * safeQty,
    embeddedBidValue: embeddedBidValue * safeQty,
    totalBid: totalBid * safeQty,
    availableCredit: availableCredit * safeQty,
    adminFeeTotal: result.adminFee * safeQty,
    reserveFundTotal: result.reserveFund * safeQty,
    insuranceTotal: result.insuranceTotal * safeQty,
    isOverBid: (totalBid * safeQty) > (result.contractedCredit * safeQty),
  };
}

export const BID_COLORS = ['var(--caixa-blue)', 'var(--caixa-orange)'];
export const COST_COLORS = ['var(--caixa-blue)', 'var(--caixa-orange)', '#4CAF50', '#9C27B0'];
