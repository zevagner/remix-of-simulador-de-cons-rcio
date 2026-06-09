/**
 * Engine canônica do Seguro Prestamista — Onda OP (operacional fixo).
 * Cobre: PF nova/antiga, PJ, elegibilidade, data corte, base zerada,
 * regressão matemática, schedule operacional FIXO.
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePrestamistaPremium,
  validatePrestamistaEligibility,
  calculatePrestamistaSchedule,
  cohortFromContractDate,
  getPrestamistaRate,
  PRESTAMISTA_RATE_LEGACY,
  PRESTAMISTA_RATE_CURRENT,
  PRESTAMISTA_MAX_AGE_AT_END,
} from '@/core/finance/prestamista';

describe('Prestamista — constantes oficiais', () => {
  it('cota antiga = 0,0680%', () => {
    expect(PRESTAMISTA_RATE_LEGACY).toBe(0.000680);
  });
  it('cota nova = 0,0765%', () => {
    expect(PRESTAMISTA_RATE_CURRENT).toBe(0.000765);
  });
  it('getPrestamistaRate respeita coorte', () => {
    expect(getPrestamistaRate('pre_2023_10_02')).toBe(0.000680);
    expect(getPrestamistaRate('post_2023_10_02')).toBe(0.000765);
    expect(getPrestamistaRate()).toBe(0.000765);
  });
});

describe('cohortFromContractDate — data de corte 02/10/2023', () => {
  it('antes de 02/10/2023 → pre', () => {
    expect(cohortFromContractDate('2023-10-01')).toBe('pre_2023_10_02');
  });
  it('em ou após 02/10/2023 → post', () => {
    expect(cohortFromContractDate('2023-10-02')).toBe('post_2023_10_02');
  });
  it('input inválido → default (post)', () => {
    expect(cohortFromContractDate(null)).toBe('post_2023_10_02');
    expect(cohortFromContractDate('not-a-date')).toBe('post_2023_10_02');
  });
});

describe('calculatePrestamistaPremium — modelo OPERACIONAL fixo', () => {
  it('PF nova, categoria R$ 363.000 → 363000 × 0,000765 = R$ 277,695', () => {
    const r = calculatePrestamistaPremium({ initialCategory: 363_000 });
    expect(r.premium).toBeCloseTo(277.695, 4);
    expect(r.rateApplied).toBe(0.000765);
    expect(r.zeroReason).toBeUndefined();
  });

  it('PF antiga, categoria R$ 300.000 → 300000 × 0,000680 = R$ 204,00', () => {
    const r = calculatePrestamistaPremium({
      initialCategory: 300_000,
      cohort: 'pre_2023_10_02',
    });
    expect(r.premium).toBeCloseTo(204, 6);
    expect(r.rateApplied).toBe(0.000680);
  });

  it('idade NÃO entra no input — engine não aceita idade', () => {
    const r = calculatePrestamistaPremium({ initialCategory: 100_000 });
    expect(r.premium).toBeCloseTo(76.5, 6);
  });
});

describe('calculatePrestamistaPremium — PJ', () => {
  it('PJ → premium = 0 com zeroReason="pj"', () => {
    const r = calculatePrestamistaPremium({
      initialCategory: 500_000,
      personType: 'PJ',
    });
    expect(r.premium).toBe(0);
    expect(r.zeroReason).toBe('pj');
  });
});

describe('calculatePrestamistaPremium — desabilitado e base zerada', () => {
  it('enabled=false → premium = 0, zeroReason="disabled"', () => {
    const r = calculatePrestamistaPremium({
      initialCategory: 200_000,
      enabled: false,
    });
    expect(r.premium).toBe(0);
    expect(r.zeroReason).toBe('disabled');
  });

  it('base 0 → premium = 0, zeroReason="no_base"', () => {
    const r = calculatePrestamistaPremium({ initialCategory: 0 });
    expect(r.premium).toBe(0);
    expect(r.zeroReason).toBe('no_base');
  });

  it('base negativa (clamp) → premium = 0', () => {
    const r = calculatePrestamistaPremium({ initialCategory: -50 });
    expect(r.premium).toBe(0);
    expect(r.base).toBe(0);
    expect(r.zeroReason).toBe('no_base');
  });
});

describe('validatePrestamistaEligibility — regra idade + prazo ≤ 80a', () => {
  it('35 anos + 200 meses → elegível', () => {
    const r = validatePrestamistaEligibility({ proponentAge: 35, termMonths: 200 });
    expect(r.eligible).toBe(true);
  });
  it('70 anos + 120 meses → 80a → INELEGÍVEL', () => {
    const r = validatePrestamistaEligibility({ proponentAge: 70, termMonths: 120 });
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe('age_at_end_exceeds_limit');
  });
  it('idade < 18 → INELEGÍVEL', () => {
    const r = validatePrestamistaEligibility({ proponentAge: 17, termMonths: 60 });
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe('age_below_min');
  });
  it('PJ → sempre INELEGÍVEL', () => {
    const r = validatePrestamistaEligibility({
      proponentAge: 30,
      termMonths: 100,
      personType: 'PJ',
    });
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe('pj');
  });
  it('inputs inválidos → reason="invalid_input"', () => {
    const r = validatePrestamistaEligibility({ proponentAge: NaN, termMonths: 100 });
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });
  it('limite oficial = 80 anos', () => {
    expect(PRESTAMISTA_MAX_AGE_AT_END).toBe(80);
  });
});

describe('calculatePrestamistaSchedule — operacional FIXO', () => {
  it('todas as linhas têm premium IDÊNTICO (fixo)', () => {
    const r = calculatePrestamistaSchedule({ initialCategory: 363_000, termMonths: 200 });
    expect(r.rows).toHaveLength(200);
    const expected = 363_000 * PRESTAMISTA_RATE_CURRENT;
    expect(r.monthlyPremium).toBeCloseTo(expected, 6);
    for (const row of r.rows) expect(row.premium).toBeCloseTo(expected, 6);
    expect(r.totalPremium).toBeCloseTo(expected * 200, 4);
  });

  it('totalPremium = monthlyPremium × termMonths (drift = 0)', () => {
    const r = calculatePrestamistaSchedule({ initialCategory: 250_000, termMonths: 100 });
    expect(r.totalPremium).toBeCloseTo(r.monthlyPremium * 100, 6);
  });

  it('PJ → schedule vazio com zeroReason="pj"', () => {
    const r = calculatePrestamistaSchedule({
      initialCategory: 100_000,
      termMonths: 60,
      personType: 'PJ',
    });
    expect(r.rows).toHaveLength(0);
    expect(r.totalPremium).toBe(0);
    expect(r.zeroReason).toBe('pj');
  });

  it('cota antiga vs nova diferem na razão exata 0,0680/0,0765', () => {
    const oldR = calculatePrestamistaSchedule({
      initialCategory: 200_000, termMonths: 100, cohort: 'pre_2023_10_02',
    });
    const newR = calculatePrestamistaSchedule({
      initialCategory: 200_000, termMonths: 100, cohort: 'post_2023_10_02',
    });
    expect(newR.totalPremium / oldR.totalPremium).toBeCloseTo(0.000765 / 0.000680, 6);
  });
});

describe('Baseline operacional CAIXA', () => {
  it('imobiliário 300k crédito + 18% adm + 3% FR, 200m → premium fixo R$ 277,70', () => {
    const credit = 300_000;
    const adm = credit * 0.18;
    const fr = credit * 0.03;
    const initialCategory = credit + adm + fr; // 363.000
    const r = calculatePrestamistaSchedule({ initialCategory, termMonths: 200 });
    expect(r.monthlyPremium).toBeCloseTo(277.695, 3);
    expect(r.totalPremium).toBeCloseTo(277.695 * 200, 2);
  });
});
