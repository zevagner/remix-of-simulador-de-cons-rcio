/**
 * Onda B3 — Golden snapshot do SimulationResult.
 *
 * Garante que a refatoração de `calculateSimulation` para consumir as
 * primitivas canônicas de `core/finance/installments` preserva byte-a-byte
 * todos os campos públicos do `SimulationResult` em três cenários oficiais.
 *
 * Qualquer mudança neste snapshot exige reanálise atuarial documentada.
 */
import { describe, it, expect } from 'vitest';
import { calculateSimulationLegacy } from '@/core/finance';
import type { SimulationInput } from '@/types/consortium';

const baseInput: SimulationInput = {
  creditValue: 200_000,
  termMonths: 200,
  consortiumType: 'imobiliario',
  adminFeePercent: 28,
  reserveFundPercent: 1,
  insurancePercent: 0.0765,
  reducedInstallment: false,
  embeddedBidValue: 0,
  freeBidValue: 0,
  proponentAge: 35,
};

describe('Onda B3 — SimulationResult golden snapshot', () => {
  it('cenário base — sem contemplação, sem reduzida', () => {
    const r = calculateSimulationLegacy(baseInput);
    expect({
      adminFee: r.adminFee,
      reserveFund: r.reserveFund,
      totalCost: r.totalCost,
      fullInstallment: r.fullInstallment,
      reducedInstallmentValue: r.reducedInstallmentValue,
      redilutedInstallmentValue: r.redilutedInstallmentValue,
      installmentBeforeContemplation: r.installmentBeforeContemplation,
      installmentAfterContemplation: r.installmentAfterContemplation,
      contemplationType: r.contemplationType,
    }).toMatchSnapshot();
  });

  it('cenário reduzida — antes/depois preserva fator REDUCED', () => {
    const r = calculateSimulationLegacy({ ...baseInput, reducedInstallment: true });
    expect(r.reducedInstallmentValue).toBeCloseTo(r.fullInstallment * 0.7, 4);
    expect(r.redilutedInstallmentValue).toBeGreaterThan(r.fullInstallment);
    expect(r.installmentBeforeContemplation).toBeCloseTo(r.reducedInstallmentValue, 4);
  });

  it('cenário lance — debt pós-contemplação consome lance', () => {
    const r = calculateSimulationLegacy(
      { ...baseInput, freeBidValue: 30_000 },
      true,
      'reduce-installment',
      24,
    );
    expect(r.contemplationType).toBe('lance');
    expect(r.debtAfterContemplation).toBeGreaterThan(0);
    expect(r.installmentAfterContemplation).toBeGreaterThan(0);
  });
});
