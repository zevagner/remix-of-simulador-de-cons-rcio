/**
 * Snapshot determinístico — garante que o split do SimulatorContext
 * (Input vs Result) NÃO alterou nenhum cálculo financeiro.
 *
 * Pós-Onda 2 (Prestamista canônico): os snapshots numéricos foram migrados
 * para `toMatchSnapshot()` para evitar drift manual quando o motor canônico
 * evolui. As INVARIANTES (linhas == prazo, parcela > 0, custo > 0) são
 * verificadas explicitamente.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateSimulation,
  calculateMonthlySchedule,
  reconcileWithSchedule,
  getEffectiveClientCost,
  deriveContemplationType,
} from '@/core/finance';
import type { SimulationInput } from '@/types/consortium';

const SCENARIOS: Array<{
  name: string;
  input: SimulationInput;
  contemplated: boolean;
  contemplationMonth: number;
}> = [
  {
    name: 'Imobiliário 450k / 200m, sem lance, sem seguro',
    input: {
      creditValue: 450000, termMonths: 200, consortiumType: 'imobiliario',
      adminFeePercent: 28, reserveFundPercent: 1, insurancePercent: 0,
      proponentAge: 0, reducedInstallment: false, freeBidValue: 0, embeddedBidValue: 0,
    },
    contemplated: false, contemplationMonth: 1,
  },
  {
    name: 'Auto 80k / 80m, lance livre 8k',
    input: {
      creditValue: 80000, termMonths: 80, consortiumType: 'auto',
      adminFeePercent: 18, reserveFundPercent: 2, insurancePercent: 0,
      proponentAge: 0, reducedInstallment: false, freeBidValue: 8000, embeddedBidValue: 0,
    },
    contemplated: true, contemplationMonth: 12,
  },
  {
    name: 'Pesados 300k / 100m, lance embutido 30%',
    input: {
      creditValue: 300000, termMonths: 100, consortiumType: 'pesados',
      adminFeePercent: 22, reserveFundPercent: 2, insurancePercent: 0,
      proponentAge: 0, reducedInstallment: false, freeBidValue: 0, embeddedBidValue: 90000,
    },
    contemplated: true, contemplationMonth: 6,
  },
];

describe('SimulatorContext — paridade pós-split (snapshot determinístico)', () => {
  for (const scenario of SCENARIOS) {
    it(scenario.name, () => {
      const ct = deriveContemplationType(
        scenario.contemplated,
        scenario.input.freeBidValue,
        scenario.input.embeddedBidValue,
      );
      const schedule = calculateMonthlySchedule({
        sim: scenario.input,
        contemplated: scenario.contemplated,
        contemplationType: ct,
        contemplationMonth: scenario.contemplationMonth,
        postLanceChoice: 'reduce-installment',
        annualAdjustmentPercent: 0,
      });
      const legacy = calculateSimulation(
        scenario.input,
        scenario.contemplated,
        'reduce-installment',
        scenario.contemplationMonth,
      );
      const result = reconcileWithSchedule(legacy, schedule, scenario.input.termMonths, {
        preserveContemplationInstallment: false,
      });
      const effectiveClientCost = getEffectiveClientCost(schedule);

      // Invariantes estruturais
      expect(schedule.rows.length).toBe(scenario.input.termMonths);
      expect(schedule.rows[0].payment).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
      expect(effectiveClientCost).toBeGreaterThan(0);
      // Sem seguro (proponentAge=0, insurancePercent=0) → totalInsurance = 0
      expect(schedule.totalInsurance).toBe(0);

      // Snapshot canônico (regenerável quando o motor evolui)
      expect({
        firstPayment: Number(schedule.rows[0].payment.toFixed(2)),
        totalCost: Number(result.totalCost.toFixed(2)),
        effectiveClientCost: Number(effectiveClientCost.toFixed(2)),
      }).toMatchSnapshot();
    });
  }
});
