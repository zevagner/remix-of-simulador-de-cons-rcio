/**
 * Validação atuarial: o saldo devedor SEMPRE deve convergir a zero ao final
 * do plano, independentemente de reajuste anual (INCC/IPCA), seguro ou
 * contemplação. Bug histórico: parcelas eram fixas no valor inicial e o
 * reajuste neutralizava a amortização, "horizontalizando" o saldo.
 */
import { describe, it, expect } from 'vitest';
import { calculateMonthlySchedule } from '@/core/finance';
import type { SimulationInput } from '@/types/consortium';

const baseInput: SimulationInput = {
  creditValue: 300000,
  termMonths: 180,
  consortiumType: 'imobiliario',
  adminFeePercent: 28,
  reserveFundPercent: 1,
  insurancePercent: 0,
  proponentAge: 35,
  reducedInstallment: false,
  freeBidValue: 0,
  embeddedBidValue: 0,
};

describe('calculateMonthlySchedule — convergência do saldo com reajuste', () => {
  it('sem reajuste — saldo final ≈ 0', () => {
    const r = calculateMonthlySchedule({ sim: baseInput, annualAdjustmentPercent: 0 });
    expect(r.rows[r.rows.length - 1].balanceEnd).toBeLessThan(1);
  });

  it('INCC 6% a.a. — saldo final ≈ 0 (custo maior, mas converge)', () => {
    const r = calculateMonthlySchedule({ sim: baseInput, annualAdjustmentPercent: 6 });
    const last = r.rows[r.rows.length - 1];
    expect(last.balanceEnd).toBeLessThan(1);
    expect(r.totalAdjustments).toBeGreaterThan(0);
    // Custo do plano é maior que o sem reajuste
    const baseR = calculateMonthlySchedule({ sim: baseInput, annualAdjustmentPercent: 0 });
    expect(r.costPlan).toBeGreaterThan(baseR.costPlan);
  });

  it('INCC 10% + parcela reduzida — saldo final ≈ 0', () => {
    const r = calculateMonthlySchedule({
      sim: { ...baseInput, reducedInstallment: true },
      annualAdjustmentPercent: 10,
    });
    expect(r.rows[r.rows.length - 1].balanceEnd).toBeLessThan(1);
  });

  it('INCC 8% + lance livre 50k mês 12 — saldo final ≈ 0', () => {
    const r = calculateMonthlySchedule({
      sim: { ...baseInput, freeBidValue: 50000 },
      contemplated: true,
      contemplationType: 'lance',
      contemplationMonth: 12,
      postLanceChoice: 'reduce-installment',
      annualAdjustmentPercent: 8,
    });
    expect(r.rows[r.rows.length - 1].balanceEnd).toBeLessThan(1);
  });

  it('INCC 6% — parcela cresce ao longo do tempo', () => {
    const r = calculateMonthlySchedule({ sim: baseInput, annualAdjustmentPercent: 6 });
    // Mês 13 (pós primeiro reajuste) > mês 1
    expect(r.rows[12].baseInstallment).toBeGreaterThan(r.rows[0].baseInstallment);
    // Mês 25 > mês 13
    expect(r.rows[24].baseInstallment).toBeGreaterThan(r.rows[12].baseInstallment);
  });
});
