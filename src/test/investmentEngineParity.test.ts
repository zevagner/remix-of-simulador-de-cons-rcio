/**
 * Onda B1 — Parity test do Investment Engine canônico.
 *
 * Garante que as primitivas em '@/core/finance/investment' produzem
 * EXATAMENTE os mesmos números das fórmulas inline que existiam antes da
 * migração (useInvestmentCalculations / useCashComparison /
 * ScenarioComparisonChart / CotaMultiplicationCard / SharedProposalPage /
 * triggersData / ProposalPdfModule).
 *
 * Se este teste quebrar, a engine divergiu — investigar antes de aceitar.
 */
import { describe, it, expect } from 'vitest';
import {
  annualToMonthlyRate,
  monthlyToAnnualRate,
  compoundGrowth,
  futureValueOfSeries,
  inccAdjust,
  inccAdjustYears,
  pricePmt,
  calculateInvestmentProjection,
} from '@/core/finance';

const round = (n: number, p = 6) => Math.round(n * 10 ** p) / 10 ** p;

describe('investment engine — parity vs fórmulas inline legadas', () => {
  it('annualToMonthlyRate ≡ (1+i)^(1/12) − 1', () => {
    for (const i of [0.05, 0.1, 0.12, 0.1375, 0.15]) {
      expect(annualToMonthlyRate(i)).toBeCloseTo(Math.pow(1 + i, 1 / 12) - 1, 12);
    }
    expect(annualToMonthlyRate(0)).toBe(0);
  });

  it('monthlyToAnnualRate ≡ (1+i)^12 − 1', () => {
    expect(monthlyToAnnualRate(0.01)).toBeCloseTo(Math.pow(1.01, 12) - 1, 12);
  });

  it('compoundGrowth ≡ P × (1+i)^n', () => {
    expect(compoundGrowth(1000, 0.01, 12)).toBeCloseTo(1000 * Math.pow(1.01, 12), 8);
    expect(compoundGrowth(450000, 0.05 / 12, 0)).toBe(450000); // periods=0 → identidade
    expect(compoundGrowth(123, 0, 50)).toBe(123); // taxa zero → identidade
  });

  it('futureValueOfSeries ≡ PMT × ((1+i)^n − 1)/i (degenera p/ PMT*n quando i=0)', () => {
    const pmt = 1500, i = 0.008, n = 60;
    expect(futureValueOfSeries(pmt, i, n)).toBeCloseTo(pmt * (Math.pow(1 + i, n) - 1) / i, 6);
    expect(futureValueOfSeries(1500, 0, 60)).toBe(90000);
    expect(futureValueOfSeries(1500, 0.01, 0)).toBe(0);
  });

  it('inccAdjust ≡ base × (1 + iMensal)^months', () => {
    const base = 450000, inccPct = 5, months = 24;
    const expected = base * Math.pow(1 + (Math.pow(1 + inccPct / 100, 1 / 12) - 1), months);
    expect(inccAdjust(base, inccPct, months)).toBeCloseTo(expected, 4);
    expect(inccAdjust(100, 0, 12)).toBe(100); // INCC zero → identidade
    expect(inccAdjust(100, 5, 0)).toBe(100); // 0 meses → identidade
  });

  it('inccAdjustYears ≡ base × (1 + iAnual)^anos (compatível com CotaMultiplicationCard)', () => {
    expect(inccAdjustYears(450000, 5, 2)).toBeCloseTo(450000 * Math.pow(1.05, 2), 6);
  });

  it('pricePmt ≡ Price installment formula', () => {
    const credit = 300000, annual = 0.12, n = 200;
    const i = annualToMonthlyRate(annual);
    const expected = credit * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    expect(pricePmt(credit, i, n)).toBeCloseTo(expected, 4);
    // Paridade com a fórmula `(P * i) / (1 - (1+i)^-n)` usada em triggersData
    const altExpected = (credit * i) / (1 - Math.pow(1 + i, -n));
    expect(round(pricePmt(credit, i, n), 4)).toBe(round(altExpected, 4));
    expect(pricePmt(0, i, n)).toBe(0);
    expect(pricePmt(credit, 0, n)).toBe(credit / n);
  });

  it('calculateInvestmentProjection — soma principal + série uniforme', () => {
    const r = annualToMonthlyRate(0.12);
    const out = calculateInvestmentProjection({
      principal: 10000, monthlyContribution: 500, annualReturnRate: 0.12, months: 24,
    });
    const expectedFinal = compoundGrowth(10000, r, 24) + futureValueOfSeries(500, r, 24);
    expect(out.finalValue).toBeCloseTo(expectedFinal, 6);
    expect(out.totalContributed).toBe(10000 + 500 * 24);
    expect(out.totalEarnings).toBeCloseTo(expectedFinal - (10000 + 500 * 24), 6);
  });
});
