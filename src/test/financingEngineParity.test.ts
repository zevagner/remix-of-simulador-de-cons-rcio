/**
 * Onda B2 — Parity tests da Engine Canônica de Financiamento.
 *
 * Garante:
 *  1. `calculatePriceSchedule` + `calculateSacSchedule` produzem o mesmo
 *     resultado que o orquestrador `calculateFinancingCost` (zero drift).
 *  2. Saldo final converge a 0 em Price e SAC, com e sem TR.
 *  3. CET (TIR) é coerente com a taxa nominal: para um cenário sem
 *     seguros/adm, CET ≈ taxa anual contratada.
 *  4. Refator preserva a interface histórica `FinancingResult`.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateFinancingCost,
  calculatePriceSchedule,
  calculateSacSchedule,
  calculateCET,
  annualToMonthlyRate,
} from '@/core/finance';

const baseArgs = {
  creditValue: 300_000,
  termMonths: 360,
  annualInterestRate: 11.5,
  mipMonthlyRate: 0.025,
  dfiMonthlyRate: 0.0035,
  adminFeeMonthly: 25,
  propertyValue: 400_000,
  trMonthlyRate: 0,
};

describe('Onda B2 — Engine Canônica de Financiamento', () => {
  it('orquestrador delega para Price e SAC sem drift', () => {
    const fin = calculateFinancingCost(
      baseArgs.creditValue, baseArgs.termMonths, baseArgs.annualInterestRate,
      baseArgs.mipMonthlyRate, baseArgs.dfiMonthlyRate, baseArgs.adminFeeMonthly,
      baseArgs.propertyValue, baseArgs.trMonthlyRate,
    );
    const price = calculatePriceSchedule(baseArgs);
    const sac = calculateSacSchedule(baseArgs);

    expect(fin.priceTotalWithInsurance).toBeCloseTo(price.totalWithInsurance, 2);
    expect(fin.sacTotalWithInsurance).toBeCloseTo(sac.totalWithInsurance, 2);
    expect(fin.priceTable.length).toBe(price.table.length);
    expect(fin.sacTable.length).toBe(sac.table.length);
    expect(fin.priceTable[0].payment).toBeCloseTo(price.table[0].payment, 4);
    expect(fin.sacTable[0].payment).toBeCloseTo(sac.table[0].payment, 4);
  });

  it('Price: saldo final ≈ 0 sem TR e com TR', () => {
    const noTR = calculatePriceSchedule(baseArgs);
    const withTR = calculatePriceSchedule({ ...baseArgs, trMonthlyRate: 0.1 });
    expect(noTR.table.at(-1)!.balance).toBeLessThan(0.01);
    expect(withTR.table.at(-1)!.balance).toBeLessThan(0.01);
  });

  it('SAC: saldo final ≈ 0 sem TR e com TR', () => {
    const noTR = calculateSacSchedule(baseArgs);
    const withTR = calculateSacSchedule({ ...baseArgs, trMonthlyRate: 0.1 });
    expect(noTR.table.at(-1)!.balance).toBeLessThan(0.01);
    expect(withTR.table.at(-1)!.balance).toBeLessThan(0.01);
  });

  it('SAC sem TR: amortização constante', () => {
    const sac = calculateSacSchedule(baseArgs);
    const expected = baseArgs.creditValue / baseArgs.termMonths;
    expect(sac.table[0].amortization).toBeCloseTo(expected, 4);
    expect(sac.table.at(-1)!.amortization).toBeCloseTo(expected, 4);
  });

  it('CET ≈ taxa anual contratada quando sem seguros/adm', () => {
    const cleanArgs = {
      ...baseArgs,
      mipMonthlyRate: 0,
      dfiMonthlyRate: 0,
      adminFeeMonthly: 0,
    };
    const price = calculatePriceSchedule(cleanArgs);
    const cet = calculateCET({
      principal: cleanArgs.creditValue,
      payments: price.table.map(r => r.payment),
    });
    const monthlyContract = annualToMonthlyRate(cleanArgs.annualInterestRate / 100);
    expect(cet.monthlyRate).toBeCloseTo(monthlyContract, 5);
    expect(cet.converged).toBe(true);
  });

  it('CET > taxa nominal quando há seguros e tarifa', () => {
    const price = calculatePriceSchedule(baseArgs);
    const cet = calculateCET({
      principal: baseArgs.creditValue,
      payments: price.table.map(r => r.payment),
    });
    const monthlyContract = annualToMonthlyRate(baseArgs.annualInterestRate / 100);
    expect(cet.monthlyRate).toBeGreaterThan(monthlyContract);
    expect(cet.converged).toBe(true);
  });
});
