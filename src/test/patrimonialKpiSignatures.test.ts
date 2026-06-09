/**
 * Patrimonial KPI Signatures — Full KPI Strategic Relevance Audit Wave.
 *
 * Trava as assinaturas curadas por estratégia: cada KPI listado precisa ter
 * justificativa consultiva real para a tese; KPIs sem valor consultivo NÃO
 * podem voltar ao blueprint sem auditoria explícita.
 */
import { describe, it, expect } from 'vitest';
import { PATRIMONIAL_STRATEGIES } from '@/components/modules/patrimonial/strategies';

const SIGNATURE: Record<string, string[]> = {
  'autoquitacao':           ['payback', 'multiplier'],
  'escada-patrimonial':     ['multiplier', 'tir'],
  'renda-passiva':          ['payback', 'roi'],
  'construcao-inteligente': ['multiplier', 'roi'],
  'multiplicacao-ativos':   ['multiplier', 'preserved', 'tir'],
  'holding-sucessao':       ['multiplier', 'preserved'],
};

describe('Patrimonial KPI signatures — relevância consultiva', () => {
  it('cobertura: existem 6 estratégias curadas', () => {
    expect(PATRIMONIAL_STRATEGIES).toHaveLength(6);
  });

  for (const [id, expected] of Object.entries(SIGNATURE)) {
    it(`${id}: assinatura = [${expected.join(', ')}]`, () => {
      const s = PATRIMONIAL_STRATEGIES.find((x) => x.id === id);
      expect(s, `estratégia "${id}" precisa existir`).toBeDefined();
      expect(s!.kpis).toEqual(expected);
    });
  }

  it('densidade: nenhuma estratégia exibe mais de 3 KPIs', () => {
    for (const s of PATRIMONIAL_STRATEGIES) {
      expect(s.kpis.length, `${s.id} excede 3 KPIs`).toBeLessThanOrEqual(3);
    }
  });

  it('densidade: maioria com 2 KPIs (foco executivo)', () => {
    const twoKpi = PATRIMONIAL_STRATEGIES.filter((s) => s.kpis.length === 2).length;
    expect(twoKpi).toBeGreaterThanOrEqual(4);
  });

  it('coerência renda-passiva: NÃO inclui multiplier (foco em renda, não alavancagem)', () => {
    const s = PATRIMONIAL_STRATEGIES.find((x) => x.id === 'renda-passiva')!;
    expect(s.kpis).not.toContain('multiplier');
  });

  it('coerência escada-patrimonial: NÃO inclui payback (sem breakeven em escalonamento)', () => {
    const s = PATRIMONIAL_STRATEGIES.find((x) => x.id === 'escada-patrimonial')!;
    expect(s.kpis).not.toContain('payback');
  });

  it('coerência construcao-inteligente: NÃO inclui payback (vivência/valorização, não recuperação)', () => {
    const s = PATRIMONIAL_STRATEGIES.find((x) => x.id === 'construcao-inteligente')!;
    expect(s.kpis).not.toContain('payback');
  });

  it('coerência holding-sucessao: NÃO inclui roi (legado, não retorno financeiro)', () => {
    const s = PATRIMONIAL_STRATEGIES.find((x) => x.id === 'holding-sucessao')!;
    expect(s.kpis).not.toContain('roi');
  });

  it('coerência autoquitacao: NÃO inclui roi (payback responde a tese)', () => {
    const s = PATRIMONIAL_STRATEGIES.find((x) => x.id === 'autoquitacao')!;
    expect(s.kpis).not.toContain('roi');
  });

  it('coerência: "preserved" só aparece em estratégias de alavancagem real', () => {
    const withPreserved = PATRIMONIAL_STRATEGIES
      .filter((s) => s.kpis.includes('preserved'))
      .map((s) => s.id);
    expect(withPreserved.sort()).toEqual(['holding-sucessao', 'multiplicacao-ativos']);
  });
});
