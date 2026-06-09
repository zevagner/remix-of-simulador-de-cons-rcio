/**
 * ════════════════════════════════════════════════════════════════════════════
 * REGRESSÃO CROSS-MODULE — SEGURO PRESTAMISTA OPERACIONAL (Onda OP)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Garante convergência entre engine canônica, motor mensal e cards de
 * Operações Estruturadas no novo modelo OPERACIONAL (premium FIXO).
 * ════════════════════════════════════════════════════════════════════════════
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePrestamistaPremium,
  getPrestamistaRate,
  PRESTAMISTA_RATE_CURRENT,
} from '@/core/finance/prestamista';
import { calculateMonthlySchedule } from '@/core/finance/internal/monthlySchedule';
import { getMIPRateByAge } from '@/utils/mipRates';
import { calculateCardResult } from '@/components/modules/structured-ops/structuredOpsConstants';
import type { SimulationInput } from '@/types/consortium';

const baseSim: SimulationInput = {
  consortiumType: 'imobiliario',
  creditValue: 300000,
  termMonths: 200,
  adminFeePercent: 28,
  reserveFundPercent: 2,
  insurancePercent: 0.0765,
  proponentAge: 35,
  reducedInstallment: false,
  embeddedBidValue: 0,
  freeBidValue: 0,
};

describe('Prestamista — consistência institucional (Onda OP)', () => {
  it('shim mipRates retorna o MESMO percentual canônico', () => {
    expect(getMIPRateByAge(25)).toBeCloseTo(PRESTAMISTA_RATE_CURRENT * 100, 6);
    expect(getMIPRateByAge(60)).toBeCloseTo(PRESTAMISTA_RATE_CURRENT * 100, 6);
  });

  it('motor mensal: premium é FIXO em TODOS os meses', () => {
    const r = calculateMonthlySchedule({ sim: baseSim });
    const first = r.rows[0].insurance;
    expect(first).toBeGreaterThan(0);
    for (const row of r.rows) {
      expect(row.insurance).toBeCloseTo(first, 6);
    }
  });

  it('motor mensal: premium = (credit + adm + FR) × taxa', () => {
    const r = calculateMonthlySchedule({ sim: baseSim });
    const initialCategory =
      baseSim.creditValue * (1 + baseSim.adminFeePercent / 100 + baseSim.reserveFundPercent / 100);
    // baseSim é imobiliário → rate vigente da modalidade imobiliária.
    const expected = initialCategory * getPrestamistaRate(undefined, 'real_estate');
    expect(r.rows[0].insurance).toBeCloseTo(expected, 4);
  });

  it('motor mensal: totalInsurance = premium × prazo (drift = 0)', () => {
    const r = calculateMonthlySchedule({ sim: baseSim });
    expect(r.totalInsurance).toBeCloseTo(r.rows[0].insurance * baseSim.termMonths, 4);
  });

  it('idade NÃO altera premium', () => {
    const a30 = calculateMonthlySchedule({ sim: { ...baseSim, proponentAge: 30 } });
    const a60 = calculateMonthlySchedule({ sim: { ...baseSim, proponentAge: 60 } });
    expect(a30.totalInsurance).toBeCloseTo(a60.totalInsurance, 4);
  });

  it('PJ → motor mensal não cobra seguro', () => {
    const pj = calculateMonthlySchedule({ sim: { ...baseSim, personType: 'PJ' } });
    expect(pj.totalInsurance).toBe(0);
  });

  it('PJ → engine canônica retorna 0 com motivo rastreável', () => {
    const result = calculatePrestamistaPremium({
      initialCategory: 100000,
      personType: 'PJ',
    });
    expect(result.premium).toBe(0);
    expect(result.zeroReason).toBe('pj');
  });

  it('Operações Estruturadas — premium FIXO operacional', () => {
    const card = calculateCardResult({
      id: 'x',
      consortiumType: 'imobiliario',
      personType: 'PF',
      creditValue: 300000,
      termMonths: 200,
      adminFeePercent: 28,
      reserveFundPercent: 2,
      proponentAge: 35,
      insuranceEnabled: true,
      embeddedBidPercent: 0,
      freeBidType: 'percent',
      freeBidValue: 0,
      freeBidPercent: 0,
      quantity: 1,
    });
    // imobiliário → rate vigente 0,000433; categoria = 300_000 × 1.30 = 390_000;
    // premium mensal = 390_000 × 0.000433 = 168.87; total = 168.87 × 200 = 33.774
    expect(card.insuranceTotal).toBeCloseTo(33774, 0);
  });

  it('Operações Estruturadas — insurance desabilitado → 0', () => {
    const card = calculateCardResult({
      id: 'x',
      consortiumType: 'imobiliario',
      personType: 'PF',
      creditValue: 300000,
      termMonths: 200,
      adminFeePercent: 28,
      reserveFundPercent: 2,
      proponentAge: 35,
      insuranceEnabled: false,
      embeddedBidPercent: 0,
      freeBidType: 'percent',
      freeBidValue: 0,
      freeBidPercent: 0,
      quantity: 1,
    });
    expect(card.insuranceTotal).toBe(0);
  });

  it('cota antiga / cota nova respeita razão exata 0,0680 / rate vigente da modalidade', () => {
    const oldCohort = calculateMonthlySchedule({
      sim: { ...baseSim, prestamistaCohort: 'pre_2023_10_02' },
    });
    const newCohort = calculateMonthlySchedule({
      sim: { ...baseSim, prestamistaCohort: 'post_2023_10_02' },
    });
    // Cohort legado retorna 0,0680% independente da modalidade (documentado).
    // baseSim é imobiliário → cohort nova usa rate vigente 0,000433.
    expect(oldCohort.totalInsurance / newCohort.totalInsurance).toBeCloseTo(
      0.000680 / 0.000433,
      4,
    );
  });
});
