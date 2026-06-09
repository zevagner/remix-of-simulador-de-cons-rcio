/**
 * FASE 1 — Item 2: Comparator agora usa o motor mensal canônico.
 * Garante: cenário sem INCC produz totalCost dentro da tolerância oficial
 * pós-Onda 2B (≤ 6%, divergência estrutural seguro decrescente vs constante).
 * Cenário com INCC>0 produz custo materialmente maior.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateSimulationLegacy,
  calculateMonthlySchedule,
  reconcileWithSchedule,
  deriveContemplationType,
} from '@/core/finance';
import type { SimulationInput } from '@/types/consortium';

const baseInput: SimulationInput = {
  creditValue: 300_000,
  termMonths: 180, // < 200 → tolerância pós-Onda 2B (≤ 6%)
  consortiumType: 'imobiliario',
  adminFeePercent: 28,
  reserveFundPercent: 1,
  insurancePercent: 0,
  proponentAge: 0, // sem seguro → comparação justa entre motores
  reducedInstallment: false,
  freeBidValue: 0,
  embeddedBidValue: 0,
};

function runComparatorPath(annualAdjustmentPercent: number) {
  const legacy = calculateSimulationLegacy(baseInput);
  const schedule = calculateMonthlySchedule({
    sim: baseInput,
    contemplated: false,
    contemplationType: deriveContemplationType(false, 0, 0),
    annualAdjustmentPercent,
  });
  return reconcileWithSchedule(legacy, schedule, baseInput.termMonths, {
    preserveContemplationInstallment: false,
  });
}

describe('Comparator — paridade motor mensal (FASE 1, Item 2)', () => {
  it('INCC=0 sem seguro: totalCost equivalente entre motores (≤1%)', () => {
    const reconciled = runComparatorPath(0);
    const legacy = calculateSimulationLegacy(baseInput);
    const diff = Math.abs(reconciled.totalCost - legacy.totalCost) / legacy.totalCost;
    // Sem seguro (insurancePercent=0) os motores devem bater quase exato:
    // a única divergência possível seria do modelo de seguro.
    expect(diff).toBeLessThanOrEqual(0.01);
  });

  it('INCC=4%: custo total materialmente maior que nominal (saldo reajustado)', () => {
    const nominal = runComparatorPath(0);
    const adjusted = runComparatorPath(4);
    expect(adjusted.totalCost).toBeGreaterThan(nominal.totalCost * 1.05);
  });
});
