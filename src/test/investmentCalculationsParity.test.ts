/**
 * Snapshot determinístico — garante que o SPLIT por cenário do
 * useInvestmentCalculations NÃO alterou nenhum valor financeiro.
 *
 * 3 cenários representativos: imobiliário não contemplado, auto contemplado
 * por sorteio, imobiliário contemplado por lance livre. Compara os 6 paths
 * + agregados contra valores fixos.
 *
 * Roda o hook isoladamente via @testing-library/react-hooks pattern com
 * renderHook do testing-library/react.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInvestmentCalculations } from '@/hooks/useInvestmentCalculations';
import { calculateMonthlySchedule } from '@/core/finance';
import type { SimulationInput, ContemplationType } from '@/types/consortium';
import type { Assumptions } from '@/components/modules/investment/investmentTypes';

const baseAssumptions = (overrides: Partial<Assumptions> = {}): Assumptions => ({
  propertyAppreciation: 5,
  investmentReturn: 12,
  rentalYield: 0.5,
  analysisMonths: 200,
  discountOnSale: 30,
  agioOnSale: 25,
  tipoVendaCarta: 'carta-contemplada',
  cdiPercent: 110,
  cdiRate: 13.75,
  contemplationMonthOverride: 12,
  previdenciaTermMonths: 200,
  previdenciaINPC: 5,
  inpcAnnualPercent: 5,
  ...overrides,
});

interface Scenario {
  name: string;
  input: SimulationInput;
  contemplated: boolean;
  contemplationType: ContemplationType;
  contemplationMonth: number;
  assumptions: Assumptions;
}

const SCENARIOS: Scenario[] = [
  {
    name: 'Imobiliário 450k / 200m — não contemplado',
    input: {
      creditValue: 450000, termMonths: 200, consortiumType: 'imobiliario',
      adminFeePercent: 28, reserveFundPercent: 1, insurancePercent: 0,
      proponentAge: 35, reducedInstallment: false, freeBidValue: 0, embeddedBidValue: 0,
    },
    contemplated: false, contemplationType: 'none', contemplationMonth: 1,
    assumptions: baseAssumptions({ contemplationMonthOverride: 24, analysisMonths: 200, previdenciaTermMonths: 200 }),
  },
  {
    name: 'Auto 80k / 80m — contemplado sorteio mês 12',
    input: {
      creditValue: 80000, termMonths: 80, consortiumType: 'auto',
      adminFeePercent: 18, reserveFundPercent: 2, insurancePercent: 0,
      proponentAge: 30, reducedInstallment: false, freeBidValue: 0, embeddedBidValue: 0,
    },
    contemplated: true, contemplationType: 'sorteio', contemplationMonth: 12,
    assumptions: baseAssumptions({ contemplationMonthOverride: 12, analysisMonths: 80, previdenciaTermMonths: 80 }),
  },
  {
    name: 'Imobiliário 300k / 200m — lance livre 30k mês 18',
    input: {
      creditValue: 300000, termMonths: 200, consortiumType: 'imobiliario',
      adminFeePercent: 25, reserveFundPercent: 1, insurancePercent: 0,
      proponentAge: 40, reducedInstallment: false, freeBidValue: 30000, embeddedBidValue: 0,
    },
    contemplated: true, contemplationType: 'lance', contemplationMonth: 18,
    assumptions: baseAssumptions({ contemplationMonthOverride: 18, analysisMonths: 200, previdenciaTermMonths: 200 }),
  },
];

describe('useInvestmentCalculations — parity (split por cenário)', () => {
  for (const sc of SCENARIOS) {
    it(`${sc.name} — produz outputs determinísticos`, () => {
      const monthlySchedule = calculateMonthlySchedule({
        sim: sc.input,
        contemplated: sc.contemplated,
        contemplationType: sc.contemplationType,
        contemplationMonth: sc.contemplationMonth,
        postLanceChoice: 'reduce-installment',
      });

      const { result } = renderHook(() => useInvestmentCalculations({
        simulatorInput: sc.input,
        monthlySchedule,
        adminFeeDiscount: 0,
        insuranceEnabled: false,
        contemplationMonth: sc.contemplationMonth,
        assumptions: sc.assumptions,
        contemplated: sc.contemplated,
        contemplationType: sc.contemplationType,
        postLanceChoice: 'reduce-installment',
      }));

      const c = result.current.calculations;
      expect(result.current.hasData).toBe(true);

      // Snapshot dos agregados + finalResult de cada path. Valores são travados
      // na PRIMEIRA execução; qualquer divergência futura indica regressão.
      expect({
        totalPaid: round(c.totalPaid),
        paidUntilContemplation: round(c.paidUntilContemplation),
        estimatedInstallment: round(c.estimatedInstallment),
        adminFee: round(c.adminFee),
        path1: round(c.path1.finalResult),
        path2: round(c.path2.finalResult),
        path3: round(c.path3.finalResult),
        path4: round(c.path4.finalResult),
        path5: round(c.path5.finalResult),
        path6: round(c.path6.finalResult),
        path2Breakeven: c.path2.breakevenMonth,
      }).toMatchSnapshot();
    });
  }

  it('estabilidade de identidade — mesmos inputs primitivos retornam mesma calculations ref', () => {
    const sc = SCENARIOS[0];
    const monthlySchedule = calculateMonthlySchedule({
      sim: sc.input,
      contemplated: sc.contemplated,
      contemplationType: sc.contemplationType,
      contemplationMonth: sc.contemplationMonth,
      postLanceChoice: 'reduce-installment',
    });

    const { result, rerender } = renderHook(
      (props: { assumptions: Assumptions }) => useInvestmentCalculations({
        simulatorInput: sc.input,
        monthlySchedule,
        adminFeeDiscount: 0,
        insuranceEnabled: false,
        contemplationMonth: sc.contemplationMonth,
        assumptions: props.assumptions,
        contemplated: sc.contemplated,
        contemplationType: sc.contemplationType,
        postLanceChoice: 'reduce-installment',
      }),
      { initialProps: { assumptions: sc.assumptions } },
    );

    const firstCalc = result.current.calculations;
    const firstPath4 = firstCalc.path4;

    // Re-render com NOVA referência de assumptions, mesmos valores → primitivos
    // estáveis devem manter cada path memoizado.
    rerender({ assumptions: { ...sc.assumptions } });

    expect(result.current.calculations.path4).toBe(firstPath4);
  });
});

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
