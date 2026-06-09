/**
 * Garante que o toggle de seguro prestamista altera o custo total do plano
 * no motor mensal (fonte de verdade) — replica o que o SimulatorContext faz.
 *
 * Bug histórico: zerar `insurancePercent` não desligava o seguro porque o motor
 * mensal usa `getInsuranceRate(age)` quando `proponentAge > 0`. A correção
 * zera também `proponentAge` quando o toggle está OFF.
 */
import { describe, it, expect } from 'vitest';
import { calculateMonthlySchedule } from '@/core/finance/internal/monthlySchedule';
import type { SimulationInput } from '@/types/consortium';

const baseInput: SimulationInput = {
  consortiumType: 'imobiliario',
  creditValue: 450000,
  termMonths: 200,
  adminFeePercent: 28,
  reserveFundPercent: 2,
  insurancePercent: 0.0006 * 100, // taxa fixa fallback
  proponentAge: 35,
  reducedInstallment: false,
  embeddedBidValue: 0,
  freeBidValue: 0,
};

function run(insuranceEnabled: boolean) {
  return calculateMonthlySchedule({
    sim: {
      ...baseInput,
      insurancePercent: insuranceEnabled ? baseInput.insurancePercent : 0,
      proponentAge: insuranceEnabled ? baseInput.proponentAge : 0,
    },
  });
}

describe('Toggle seguro prestamista — afeta custo total', () => {
  it('seguro ON gera totalInsurance > 0 e costWithInsurance > costPlan', () => {
    const on = run(true);
    expect(on.totalInsurance).toBeGreaterThan(0);
    expect(on.costWithInsurance).toBeGreaterThan(on.costPlan);
  });

  it('seguro OFF zera totalInsurance e costWithInsurance == costPlan', () => {
    const off = run(false);
    expect(off.totalInsurance).toBe(0);
    expect(off.costWithInsurance).toBeCloseTo(off.costPlan, 6);
  });

  it('costWithInsurance ON > costWithInsurance OFF (diferença > 0)', () => {
    const on = run(true);
    const off = run(false);
    expect(on.costWithInsurance).toBeGreaterThan(off.costWithInsurance);
    expect(on.costWithInsurance - off.costWithInsurance).toBeCloseTo(on.totalInsurance, 6);
  });
});
