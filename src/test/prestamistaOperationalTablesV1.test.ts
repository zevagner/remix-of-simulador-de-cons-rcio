/**
 * ════════════════════════════════════════════════════════════════════════════
 * PRESTAMISTA — PARITY TESTS DAS TABELAS OPERACIONAIS V1
 * ════════════════════════════════════════════════════════════════════════════
 * Verifica que a engine única reproduz exatamente os PDFs CAIXA confirmados
 * para vehicle_light/80m, vehicle_heavy/100m e real_estate/173m.
 * ════════════════════════════════════════════════════════════════════════════
 */
import { describe, it, expect } from 'vitest';
import {
  calculateOperationalPrestamista,
  calculateOperationalPrestamistaForType,
  getPrestamistaOperationalFactor,
  PRESTAMISTA_OPERATIONAL_TABLE_V1,
} from '@/core/finance/prestamista';
import { calculateMonthlySchedule } from '@/core/finance/internal/monthlySchedule';
import type { SimulationInput } from '@/types/consortium';

describe('Prestamista Operational Tables V1 — lookup', () => {
  it('tabela contém os cenários operacionais confirmados (apenas veículos)', () => {
    // Pós-remoção do workaround 173m: a tabela só retém os fatores
    // operacionais documentados (vehicle_light/80m e vehicle_heavy/100m).
    // Imobiliário agora usa rate canônica vigente sem fator multiplicador.
    expect(PRESTAMISTA_OPERATIONAL_TABLE_V1).toHaveLength(2);
  });
  it('vehicle_light / 80m → factor 1.0 (exact)', () => {
    const r = getPrestamistaOperationalFactor('vehicle_light', 80);
    expect(r.factor).toBe(1.0);
    expect(r.source).toBe('exact');
  });
  it('vehicle_heavy / 100m → factor 0.9 (exact)', () => {
    const r = getPrestamistaOperationalFactor('vehicle_heavy', 100);
    expect(r.factor).toBe(0.9);
    expect(r.source).toBe('exact');
  });
  it('real_estate / 173m → fallback 1.0 (workaround removido)', () => {
    // O fator 0.566 era um workaround histórico criado quando a rate
    // imobiliária era 0.000765. Com a rate corrigida 0.000433 ele
    // deixou de ser necessário e foi removido da tabela.
    const r = getPrestamistaOperationalFactor('real_estate', 173);
    expect(r.factor).toBe(1.0);
    expect(r.source).toBe('fallback');
  });
  it('cenário fora da tabela → fallback 1.0 com source="fallback"', () => {
    const r = getPrestamistaOperationalFactor('real_estate', 999);
    expect(r.factor).toBe(1.0);
    expect(r.source).toBe('fallback');
  });
});

describe('Prestamista — parity vs PDFs oficiais CAIXA', () => {
  it('VEÍCULOS LEVES 80m — 100k / 18% / 3,5% → ≈ R$ 92,95', () => {
    const r = calculateOperationalPrestamista({
      creditValue: 100_000,
      adminFeeTotal: 100_000 * 0.18,
      reserveFundTotal: 100_000 * 0.035,
      termMonths: 80,
      modality: 'vehicle_light',
    });
    expect(r.factorSource).toBe('exact');
    expect(r.operationalFactor).toBe(1.0);
    expect(r.monthlyPremium).toBeCloseTo(92.9475, 2); // 121500 × 1.0 × 0.000765
  });

  it('VEÍCULOS PESADOS 100m — 200k / 15% / 3,5% → ≈ R$ 163,20', () => {
    const r = calculateOperationalPrestamista({
      creditValue: 200_000,
      adminFeeTotal: 200_000 * 0.15,
      reserveFundTotal: 200_000 * 0.035,
      termMonths: 100,
      modality: 'vehicle_heavy',
    });
    expect(r.factorSource).toBe('exact');
    expect(r.operationalFactor).toBe(0.9);
    // 237000 × 0.9 × 0.000765 = 163,1745
    expect(r.monthlyPremium).toBeCloseTo(163.17, 1);
    expect(Math.abs(r.monthlyPremium - 163.20)).toBeLessThan(0.5);
  });

  it('IMOBILIÁRIO 173m — 325.969,42 / 21% / 2,5% → ≈ R$ 174,31 (rate vigente sem fator)', () => {
    const credit = 325_969.42;
    const r = calculateOperationalPrestamista({
      creditValue: credit,
      adminFeeTotal: credit * 0.21,
      reserveFundTotal: credit * 0.025,
      termMonths: 173,
      modality: 'real_estate',
    });
    // Sem entrada exata na tabela → fallback 1.0; rate vigente da modalidade
    // imobiliária (0,000433) aplicada sobre a categoria inicial reproduz o PDF.
    expect(r.factorSource).toBe('fallback');
    expect(r.operationalFactor).toBe(1.0);
    // initialCategory ≈ 402.572,03 × 1.0 × 0.000433 ≈ 174,31
    expect(r.monthlyPremium).toBeCloseTo(174.31, 1);
    expect(Math.abs(r.monthlyPremium - 174.32)).toBeLessThan(0.5);
  });
});

describe('Prestamista — drift = 0 entre engine única e motor mensal', () => {
  function sim(consortiumType: SimulationInput['consortiumType'], term: number, credit: number, adm: number, fr: number): SimulationInput {
    return {
      creditValue: credit,
      termMonths: term,
      consortiumType,
      adminFeePercent: adm,
      reserveFundPercent: fr,
      insurancePercent: 0.0765,
      proponentAge: 35,
      reducedInstallment: false,
      embeddedBidValue: 0,
      freeBidValue: 0,
    };
  }

  it('vehicle_light 80m: motor mensal = engine institucional (drift 0)', () => {
    const s = sim('auto', 80, 100_000, 18, 3.5);
    const monthly = calculateMonthlySchedule({ sim: s });
    const op = calculateOperationalPrestamistaForType({
      creditValue: 100_000, adminFeeTotal: 18_000, reserveFundTotal: 3_500,
      termMonths: 80, consortiumType: 'auto',
    });
    expect(monthly.rows[0].insurance).toBeCloseTo(op.monthlyPremium, 6);
    expect(monthly.totalInsurance).toBeCloseTo(op.totalPremium, 4);
    // FIXO: todos os meses iguais
    for (const row of monthly.rows) expect(row.insurance).toBeCloseTo(op.monthlyPremium, 6);
  });

  it('vehicle_heavy 100m: motor mensal aplica fator 0.9', () => {
    const s = sim('pesados', 100, 200_000, 15, 3.5);
    const monthly = calculateMonthlySchedule({ sim: s });
    expect(monthly.rows[0].insurance).toBeCloseTo(163.1745, 2);
  });

  it('real_estate 173m: motor mensal aplica fator 0.566', () => {
    const s = sim('imobiliario', 173, 325_969.42, 21, 2.5);
    const monthly = calculateMonthlySchedule({ sim: s });
    expect(monthly.rows[0].insurance).toBeCloseTo(174.29, 1);
  });
});

describe('Prestamista — composição da parcela alinhada', () => {
  it('parcela = (FC + TA + FR + seguro_total) / N nos 3 cenários', () => {
    const cases = [
      { type: 'auto' as const, term: 80, credit: 100_000, adm: 18, fr: 3.5 },
      { type: 'pesados' as const, term: 100, credit: 200_000, adm: 15, fr: 3.5 },
      { type: 'imobiliario' as const, term: 173, credit: 325_969.42, adm: 21, fr: 2.5 },
    ];
    for (const c of cases) {
      const s: SimulationInput = {
        creditValue: c.credit, termMonths: c.term, consortiumType: c.type,
        adminFeePercent: c.adm, reserveFundPercent: c.fr,
        insurancePercent: 0.0765, proponentAge: 35,
        reducedInstallment: false, embeddedBidValue: 0, freeBidValue: 0,
      };
      const monthly = calculateMonthlySchedule({ sim: s });
      const totalAdmin = c.credit * c.adm / 100;
      const totalFR = c.credit * c.fr / 100;
      const expectedFull = (c.credit + totalAdmin + totalFR + monthly.totalInsurance) / c.term;
      expect(monthly.rows[0].baseInstallment + monthly.rows[0].insurance).toBeCloseTo(expectedFull, 2);
    }
  });
});
