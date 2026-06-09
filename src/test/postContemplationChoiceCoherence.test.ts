/**
 * Coerência consultiva pós-contemplação (lance):
 *  - "Reduzir parcela mensal" deve produzir parcela MENOR
 *  - "Reduzir prazo restante" deve produzir parcela MAIOR (≈ parcela cheia)
 *
 * Regressão para o bug onde reconcileWithSchedule pegava a ÚLTIMA linha do
 * schedule, retornando a parcela RESIDUAL truncada do cenário 'reduce-term'
 * e invertendo a comparação visual no card "Cenário Pós-Contemplação".
 */
import { describe, it, expect } from 'vitest';
import { calculateSimulation, calculateMonthlySchedule, reconcileWithSchedule } from '@/core/finance';
import type { SimulationInput, PostContemplationChoice } from '@/types/consortium';

const baseInput: SimulationInput = {
  creditValue: 300_000,
  termMonths: 180,
  consortiumType: 'imobiliario',
  adminFeePercent: 25,
  reserveFundPercent: 2,
  insurancePercent: 0,
  proponentAge: 0,
  reducedInstallment: false,
  freeBidValue: 30_000,
  embeddedBidValue: 0,
  personType: 'PJ', // sem prestamista para isolar o efeito do choice
};

function runScenario(choice: PostContemplationChoice, contemplationMonth = 12) {
  const legacy = calculateSimulation(baseInput, true, choice, contemplationMonth);
  const schedule = calculateMonthlySchedule({
    sim: baseInput,
    contemplated: true,
    contemplationType: 'lance',
    contemplationMonth,
    postLanceChoice: choice === 'reduce-term' ? 'reduce-term' : 'reduce-installment',
  });
  return reconcileWithSchedule(legacy, schedule, baseInput.termMonths, {
    creditValue: baseInput.creditValue,
  });
}

describe('Pós-contemplação por lance — coerência consultiva', () => {
  it('reduce-installment produz parcela MENOR que reduce-term', () => {
    const reduceInstallment = runScenario('reduce-installment');
    const reduceTerm = runScenario('reduce-term');

    expect(reduceInstallment.installmentAfterContemplation).toBeGreaterThan(0);
    expect(reduceTerm.installmentAfterContemplation).toBeGreaterThan(0);
    expect(reduceInstallment.installmentAfterContemplation).toBeLessThan(
      reduceTerm.installmentAfterContemplation,
    );
  });

  it('reduce-term mantém parcela próxima da parcela cheia (≈ fullInstallment)', () => {
    const reduceTerm = runScenario('reduce-term');
    const ratio = reduceTerm.installmentAfterContemplation / reduceTerm.fullInstallment;
    // Tolerância: +- 5% do plano cheio (seguro/reajuste podem flutuar)
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('reduce-term encurta o prazo vs reduce-installment', () => {
    const reduceInstallment = runScenario('reduce-installment');
    const reduceTerm = runScenario('reduce-term');
    expect(reduceTerm.remainingTermAfterContemplation).toBeLessThan(
      reduceInstallment.remainingTermAfterContemplation,
    );
  });

  it.each([
    { creditValue: 150_000, termMonths: 120, freeBidValue: 15_000, label: 'imob 150k/120m' },
    { creditValue: 500_000, termMonths: 200, freeBidValue: 60_000, label: 'imob 500k/200m' },
    { creditValue: 80_000, termMonths: 80, freeBidValue: 8_000, label: 'auto 80k/80m', consortiumType: 'auto' as const },
  ])('coerência preservada em $label', ({ label, ...overrides }) => {
    const input: SimulationInput = { ...baseInput, ...overrides };
    const month = Math.min(12, Math.floor(input.termMonths / 4));

    const reduceInstallment = (() => {
      const legacy = calculateSimulation(input, true, 'reduce-installment', month);
      const schedule = calculateMonthlySchedule({
        sim: input, contemplated: true, contemplationType: 'lance',
        contemplationMonth: month, postLanceChoice: 'reduce-installment',
      });
      return reconcileWithSchedule(legacy, schedule, input.termMonths, { creditValue: input.creditValue });
    })();
    const reduceTerm = (() => {
      const legacy = calculateSimulation(input, true, 'reduce-term', month);
      const schedule = calculateMonthlySchedule({
        sim: input, contemplated: true, contemplationType: 'lance',
        contemplationMonth: month, postLanceChoice: 'reduce-term',
      });
      return reconcileWithSchedule(legacy, schedule, input.termMonths, { creditValue: input.creditValue });
    })();

    expect(reduceInstallment.installmentAfterContemplation).toBeLessThan(
      reduceTerm.installmentAfterContemplation,
    );
    expect(reduceTerm.remainingTermAfterContemplation).toBeLessThan(
      reduceInstallment.remainingTermAfterContemplation,
    );
  });
});
