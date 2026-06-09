import { describe, it, expect } from 'vitest';
import { validatePrestamistaEligibility } from '@/core/finance';
import { calculateCardResult } from '@/components/modules/structured-ops/structuredOpsConstants';
import { createEmptyCard } from '@/components/modules/structured-ops/structuredOpsConstants';

/**
 * Onda 3 — Hardening de Elegibilidade e UX
 *
 * Estes testes garantem o *comportamento operacional* exigido pela onda:
 *   1. Hard-stop de elegibilidade (PF inelegível → seguro = 0)
 *   2. PJ → seguro sempre 0 (independente de toggle/idade)
 *   3. Transições idade/prazo respeitam a engine canônica
 *
 * NÃO testam matemática — isso é coberto por `prestamistaCanonical.test.ts`
 * e `prestamistaCrossModuleConsistency.test.ts`.
 */

describe('Prestamista Wave 3 — eligibility hard-stop', () => {
  it('PF jovem + prazo curto → elegível', () => {
    const e = validatePrestamistaEligibility({ proponentAge: 35, termMonths: 200, personType: 'PF' });
    expect(e.eligible).toBe(true);
  });

  it('PF idoso + prazo longo → inelegível', () => {
    const e = validatePrestamistaEligibility({ proponentAge: 75, termMonths: 240, personType: 'PF' });
    expect(e.eligible).toBe(false);
    expect(e.reason).toBe('age_at_end_exceeds_limit');
  });

  it('PJ → sempre inelegível, mesmo com idade/prazo OK', () => {
    const e = validatePrestamistaEligibility({ proponentAge: 30, termMonths: 120, personType: 'PJ' });
    expect(e.eligible).toBe(false);
    expect(e.reason).toBe('pj');
  });

  it('PJ em StructuredOps → insuranceTotal sempre 0 mesmo com toggle ligado', () => {
    const card = { ...createEmptyCard(), personType: 'PJ' as const, insuranceEnabled: true };
    const r = calculateCardResult(card);
    expect(r.insuranceTotal).toBe(0);
  });

  it('PF default em StructuredOps → insuranceTotal > 0 com toggle ligado', () => {
    const card = { ...createEmptyCard(), personType: 'PF' as const, insuranceEnabled: true };
    const r = calculateCardResult(card);
    expect(r.insuranceTotal).toBeGreaterThan(0);
  });

  it('Transição PF → PJ via card update zera insuranceTotal', () => {
    const pf = calculateCardResult({ ...createEmptyCard(), personType: 'PF', insuranceEnabled: true });
    const pj = calculateCardResult({ ...createEmptyCard(), personType: 'PJ', insuranceEnabled: true });
    expect(pf.insuranceTotal).toBeGreaterThan(0);
    expect(pj.insuranceTotal).toBe(0);
  });
});
