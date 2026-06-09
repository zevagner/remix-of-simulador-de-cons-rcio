/**
 * StructuredOps × Motor Canônico — paridade pós-Correção C1 (Auditoria 2026-05-24)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Após a migração de `calculateCardResult` para `calculateMonthlySchedule` +
 * `reconcileWithSchedule`, esta suite valida que os agregados expostos pelo
 * StructuredOps (initialInstallment / installmentAfterContemplation /
 * totalPaid / contractedCredit / netCreditValue) são derivados da MESMA fonte
 * canônica usada pelo Simulador.
 *
 * Importante: o modelo de StructuredOps trata cada carta como CONTEMPLADA por
 * LANCE no mês 1 com `reduce-installment` (semântica histórica preservada na
 * migração). Os testes abaixo invocam o pipeline canônico com EXATAMENTE
 * esses parâmetros — não com flags arbitrárias —, garantindo que a parcela
 * pós-contemplação reflita o regime real do card.
 */
import { describe, it, expect } from 'vitest';
import { calculateCardResult } from '@/components/modules/structured-ops/structuredOpsConstants';
import type { CreditCard } from '@/components/modules/structured-ops/structuredOpsTypes';
import {
  calculateSimulation,
  deriveContemplationType,
} from '@/core/finance/internal/calculations';
import { calculateMonthlySchedule } from '@/core/finance/internal/monthlySchedule';
import { reconcileWithSchedule } from '@/core/finance/internal/reconcile';
import { PRESTAMISTA_RATE_CURRENT } from '@/core/finance/prestamista';
import type { SimulationInput, SimulationResult } from '@/types/consortium';

/** Reproduz o mapeamento CreditCard → SimulationInput usado em calculateCardResult. */
function buildSim(card: CreditCard): SimulationInput {
  const embeddedBidValue = (card.creditValue * card.embeddedBidPercent) / 100;
  const freeBidValueR$ =
    card.freeBidType === 'percent'
      ? (card.creditValue * card.freeBidPercent) / 100
      : card.freeBidValue;
  const personType = card.personType ?? 'PF';
  return {
    creditValue: card.creditValue,
    termMonths: card.termMonths,
    consortiumType: card.consortiumType,
    adminFeePercent: card.adminFeePercent,
    reserveFundPercent: card.reserveFundPercent,
    insurancePercent: card.insuranceEnabled ? PRESTAMISTA_RATE_CURRENT * 100 : 0,
    proponentAge: card.insuranceEnabled ? card.proponentAge : 0,
    reducedInstallment: false,
    freeBidValue: freeBidValueR$,
    embeddedBidValue,
    personType,
  };
}

/** Roda o pipeline canônico com os mesmos parâmetros usados internamente pelo card. */
function runCanonical(card: CreditCard): SimulationResult {
  const sim = buildSim(card);
  const contemplated = true;
  const contemplationMonth = 1;
  const postLanceChoice: 'reduce-installment' = 'reduce-installment';
  const ct = deriveContemplationType(contemplated, sim.freeBidValue, sim.embeddedBidValue);
  const schedule = calculateMonthlySchedule({
    sim,
    contemplated,
    contemplationType: ct,
    contemplationMonth,
    postLanceChoice,
  });
  globalThis.__calcSimAllowedCaller = true;
  let legacy: SimulationResult;
  try {
    legacy = calculateSimulation(sim, contemplated, postLanceChoice, contemplationMonth);
  } finally {
    globalThis.__calcSimAllowedCaller = false;
  }
  return reconcileWithSchedule(legacy, schedule, card.termMonths, { creditValue: card.creditValue });
}

const TOL = 0.01; // ±1%

function approxPct(actual: number, expected: number, tol = TOL): boolean {
  if (expected === 0) return Math.abs(actual) <= 0.5;
  return Math.abs(actual - expected) / Math.abs(expected) <= tol;
}

function makeCard(overrides: Partial<CreditCard>): CreditCard {
  return {
    id: 'test',
    consortiumType: 'imobiliario',
    personType: 'PF',
    creditValue: 300000,
    termMonths: 180,
    adminFeePercent: 20,
    reserveFundPercent: 2,
    proponentAge: 35,
    insuranceEnabled: false,
    embeddedBidPercent: 0,
    freeBidType: 'value',
    freeBidValue: 0,
    freeBidPercent: 0,
    quantity: 1,
    ...overrides,
  };
}

describe('StructuredOps × Motor Canônico — paridade pós-C1', () => {
  describe('Cenário A — Imóvel base sem lance, sem seguro, quantity 1', () => {
    const card = makeCard({});
    const cardResult = calculateCardResult(card);
    const canonical = runCanonical(card);

    it('initialInstallment ≈ fullInstallment (±1%)', () => {
      expect(approxPct(cardResult.initialInstallment, canonical.fullInstallment)).toBe(true);
    });
    it('totalPaid ≈ canonical.totalCost (±1%)', () => {
      expect(approxPct(cardResult.totalPaid, canonical.totalCost)).toBe(true);
    });
    it('totalCreditValue === canonical.contractedCredit', () => {
      expect(cardResult.totalCreditValue).toBe(canonical.contractedCredit);
    });
  });

  describe('Cenário B — Imóvel lance próprio 30%, sem seguro, quantity 1', () => {
    const card = makeCard({
      freeBidType: 'value',
      freeBidValue: 90000,
    });
    const cardResult = calculateCardResult(card);
    const canonical = runCanonical(card);

    it('initialInstallment ≈ fullInstallment (±1%)', () => {
      expect(approxPct(cardResult.initialInstallment, canonical.fullInstallment)).toBe(true);
    });
    it('installmentAfterContemplation ≈ canonical.installmentAfterContemplation (±1%)', () => {
      expect(
        approxPct(cardResult.installmentAfterContemplation, canonical.installmentAfterContemplation),
      ).toBe(true);
    });
    it('totalPaid ≈ canonical.totalCost (±1%)', () => {
      expect(approxPct(cardResult.totalPaid, canonical.totalCost)).toBe(true);
    });
    it('freeBidValue === 90000', () => {
      expect(cardResult.freeBidValue).toBe(90000);
    });
  });

  describe('Cenário C — Imóvel lance embutido 25%, com seguro, quantity 2', () => {
    const card = makeCard({
      creditValue: 500000,
      termMonths: 200,
      adminFeePercent: 21,
      reserveFundPercent: 2.5,
      insuranceEnabled: true,
      embeddedBidPercent: 25,
      quantity: 2,
    });
    const cardResult = calculateCardResult(card);
    const canonical = runCanonical(card);
    const embeddedBidExpected = (500000 * 25) / 100; // 125000

    it('totalCreditValue === canonical.contractedCredit * 2', () => {
      expect(cardResult.totalCreditValue).toBe(canonical.contractedCredit * 2);
    });
    it('totalInitialInstallment ≈ fullInstallment * 2 (±1%)', () => {
      expect(approxPct(cardResult.totalInitialInstallment, canonical.fullInstallment * 2)).toBe(true);
    });
    it('totalInstallmentAfterContemplation ≈ installmentAfterContemplation * 2 (±1%)', () => {
      expect(
        approxPct(
          cardResult.totalInstallmentAfterContemplation,
          canonical.installmentAfterContemplation * 2,
        ),
      ).toBe(true);
    });
    it('availableCredit ≈ canonical.netCreditValue * 2 (±1%)', () => {
      expect(approxPct(cardResult.availableCredit, canonical.netCreditValue * 2)).toBe(true);
    });
    it('embeddedBidValue === 125000 * 2 (agregado por quantity)', () => {
      expect(cardResult.embeddedBidValue).toBe(embeddedBidExpected * 2);
    });
  });

  describe('Cenário D — Veículo sem lance, sem seguro, quantity 3', () => {
    const card = makeCard({
      consortiumType: 'auto',
      creditValue: 200000,
      termMonths: 120,
      adminFeePercent: 18,
      reserveFundPercent: 2,
      quantity: 3,
    });
    const cardResult = calculateCardResult(card);

    it('totalCreditValue === availableCredit (sem lance embutido → carta cheia)', () => {
      // availableCredit já está agregado por quantity; sem embedded bid são iguais.
      expect(cardResult.totalCreditValue).toBe(cardResult.availableCredit);
    });
    it('totalInitialInstallment ≈ initialInstallment * 3 (±0.01)', () => {
      expect(cardResult.totalInitialInstallment).toBeCloseTo(cardResult.initialInstallment * 3, 2);
    });
    it('totalInstallmentAfterContemplation ≈ installmentAfterContemplation * 3 (±0.01)', () => {
      expect(cardResult.totalInstallmentAfterContemplation).toBeCloseTo(
        cardResult.installmentAfterContemplation * 3,
        2,
      );
    });
    it('totalBid === 0 (sem lance livre nem embutido)', () => {
      expect(cardResult.totalBid).toBe(0);
    });
  });
});
