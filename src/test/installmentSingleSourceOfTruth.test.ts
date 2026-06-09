/**
 * Onda A — Single Source of Truth da PARCELA
 * ════════════════════════════════════════════════════════════════════════
 * Garante que `result.fullInstallment` (após reconcile) é IGUAL à soma
 * dos componentes que o card "Composição da Parcela" mostraria. Antes
 * desta onda existia drift estrutural quando o seguro estava habilitado.
 *
 * Inputs cobertos:
 *   • PF com seguro (caso onde o drift existia)
 *   • PJ sem seguro (caso onde drift sempre foi zero)
 *   • Auto sem seguro (snapshot canônico)
 */
import { describe, it, expect } from 'vitest';
import {
  calculateSimulation,
  calculateMonthlySchedule,
  reconcileWithSchedule,
  deriveContemplationType,
} from '@/core/finance';
import { PRESTAMISTA_RATE_CURRENT } from '@/core/finance/prestamista';
import type { SimulationInput } from '@/types/consortium';

interface Case {
  name: string;
  input: SimulationInput;
}

const CASES: Case[] = [
  {
    name: 'Imobiliário 450k / 200m, PF com seguro (caso de drift histórico)',
    input: {
      creditValue: 450000, termMonths: 200, consortiumType: 'imobiliario',
      adminFeePercent: 17.42, reserveFundPercent: 2.5,
      insurancePercent: PRESTAMISTA_RATE_CURRENT * 100,
      proponentAge: 35, reducedInstallment: false,
      freeBidValue: 0, embeddedBidValue: 0, personType: 'PF',
    },
  },
  {
    name: 'Auto 80k / 80m, PJ sem seguro',
    input: {
      creditValue: 80000, termMonths: 80, consortiumType: 'auto',
      adminFeePercent: 18, reserveFundPercent: 2, insurancePercent: 0,
      proponentAge: 0, reducedInstallment: false,
      freeBidValue: 0, embeddedBidValue: 0, personType: 'PJ',
    },
  },
  {
    name: 'Pesados 300k / 100m, PF, lance livre 30k',
    input: {
      creditValue: 300000, termMonths: 100, consortiumType: 'pesados',
      adminFeePercent: 22, reserveFundPercent: 2,
      insurancePercent: PRESTAMISTA_RATE_CURRENT * 100,
      proponentAge: 40, reducedInstallment: false,
      freeBidValue: 30000, embeddedBidValue: 0, personType: 'PF',
    },
  },
];

describe('Onda A — fullInstallment canônico (composição == parcela oficial)', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const ct = deriveContemplationType(false, c.input.freeBidValue, c.input.embeddedBidValue);
      const schedule = calculateMonthlySchedule({
        sim: c.input,
        contemplated: false,
        contemplationType: ct,
        contemplationMonth: 0,
        postLanceChoice: 'reduce-installment',
      });
      const legacy = calculateSimulation(c.input, false, 'reduce-installment', 0);
      const result = reconcileWithSchedule(legacy, schedule, c.input.termMonths, {
        creditValue: c.input.creditValue,
      });

      // 1. fullInstallment é exatamente (credit + adm + FR + seguroReal) / N
      const adminFee = (c.input.creditValue * c.input.adminFeePercent) / 100;
      const reserveFund = (c.input.creditValue * c.input.reserveFundPercent) / 100;
      const expectedFull = (c.input.creditValue + adminFee + reserveFund + schedule.totalInsurance) / c.input.termMonths;
      expect(result.fullInstallment).toBeCloseTo(expectedFull, 6);

      // 2. Decomposição da composição == fullInstallment (drift zero)
      const monthlyCommon = c.input.creditValue / c.input.termMonths;
      const monthlyAdmin = adminFee / c.input.termMonths;
      const monthlyReserve = reserveFund / c.input.termMonths;
      const monthlyInsurance = result.monthlyInsurance;
      const sumOfRow = monthlyCommon + monthlyAdmin + monthlyReserve + monthlyInsurance;
      expect(sumOfRow).toBeCloseTo(result.fullInstallment, 6);

      // 3. monthlyInsurance reconciliado == totalInsurance / termMonths
      expect(result.monthlyInsurance).toBeCloseTo(schedule.totalInsurance / c.input.termMonths, 6);
    });
  }
});
