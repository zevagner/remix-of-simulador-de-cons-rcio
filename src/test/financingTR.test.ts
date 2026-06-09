/**
 * FASE 1 — Item 1: TR no financiamento.
 * Garante: (a) regressão zero quando trRate = 0, (b) saldo converge a 0 com TR > 0.
 */
import { describe, it, expect } from 'vitest';
import { calculateFinancingCost } from '@/core/finance';

const CREDIT = 300_000;
const TERM = 240;
const RATE = 12; // % a.a.

describe('calculateFinancingCost — TR (FASE 1)', () => {
  it('TR=0 mantém parcela Price clássica e custo total inalterado (regressão zero)', () => {
    const noTR = calculateFinancingCost(CREDIT, TERM, RATE, 0.02, 0.03, 25, CREDIT, 0);
    const noTR2 = calculateFinancingCost(CREDIT, TERM, RATE, 0.02, 0.03, 25, CREDIT);
    expect(noTR.priceTotalCost).toBeCloseTo(noTR2.priceTotalCost, 2);
    expect(noTR.sacTotalCost).toBeCloseTo(noTR2.sacTotalCost, 2);
    // 1ª parcela Price = parcela fixa clássica
    expect(noTR.priceTable[0].amortization + noTR.priceTable[0].interest)
      .toBeCloseTo(noTR.priceMonthlyPayment, 2);
  });

  it('Price com TR=0,1% a.m.: saldo final converge a 0 e custo > nominal', () => {
    const r = calculateFinancingCost(CREDIT, TERM, RATE, 0.02, 0.03, 25, CREDIT, 0.10);
    const lastBalance = r.priceTable[r.priceTable.length - 1].balance;
    expect(lastBalance).toBeLessThan(1);
    const nominal = calculateFinancingCost(CREDIT, TERM, RATE, 0.02, 0.03, 25, CREDIT, 0);
    expect(r.priceTotalCost).toBeGreaterThan(nominal.priceTotalCost);
  });

  it('SAC com TR=0,2% a.m.: saldo final converge a 0', () => {
    const r = calculateFinancingCost(CREDIT, TERM, RATE, 0.02, 0.03, 25, CREDIT, 0.20);
    const lastBalance = r.sacTable[r.sacTable.length - 1].balance;
    expect(lastBalance).toBeLessThan(1);
  });

  it('TR no limite (2% a.m.): ainda converge', () => {
    const r = calculateFinancingCost(CREDIT, 120, RATE, 0.02, 0.03, 25, CREDIT, 2);
    expect(r.priceTable[r.priceTable.length - 1].balance).toBeLessThan(1);
    expect(r.sacTable[r.sacTable.length - 1].balance).toBeLessThan(1);
  });
});
