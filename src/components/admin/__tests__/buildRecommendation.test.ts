import { describe, it, expect } from 'vitest';
import { buildRecommendation, type Recommendation } from '../AdminAIPerformance';

const base = {
  ttftP95: 800,
  avgTotal: 1500,
  abandonRate: 2,
  slowRate: 5,
  totalCalls: 100,
};

function assertGeneralRules(r: Recommendation) {
  // sempre exatamente 1 ação
  expect(r.actions).toHaveLength(1);
  // prioridade nunca indefinida
  expect(['high', 'medium', 'low', 'none']).toContain(r.priority);
  // mensagem nunca vazia
  expect(r.actions[0]).toBeTruthy();
  expect(r.actions[0].trim().length).toBeGreaterThan(0);
}

describe('buildRecommendation', () => {
  it('Caso 1 — sem dados (totalCalls=0) retorna "Aguardando dados para análise."', () => {
    const r = buildRecommendation({ ...base, totalCalls: 0 });
    assertGeneralRules(r);
    expect(r.priority).toBe('none');
    expect(r.actions).toEqual(['Aguardando dados para análise.']);
  });

  it('Caso 2 — TTFT crítico + abandono crítico → uma única mensagem combinada (high)', () => {
    const r = buildRecommendation({ ...base, ttftP95: 3000, abandonRate: 25 });
    assertGeneralRules(r);
    expect(r.priority).toBe('high');
    expect(r.actions[0]).toMatch(/TTFT crítico.*abandono/i);
  });

  it('Caso 3 — apenas abandono crítico → mensagem de abandono (high)', () => {
    const r = buildRecommendation({ ...base, abandonRate: 30 });
    assertGeneralRules(r);
    expect(r.priority).toBe('high');
    expect(r.actions[0]).toMatch(/desistindo|tempo percebido|streaming/i);
  });

  it('Caso 4 — apenas TTFT crítico → mensagem de redução de prompt/modelo (high)', () => {
    const r = buildRecommendation({ ...base, ttftP95: 3000 });
    assertGeneralRules(r);
    expect(r.priority).toBe('high');
    expect(r.actions[0]).toMatch(/reduzir prompt|trocar modelo/i);
  });

  it('Caso 5 — slowRate alto → mensagem de cache/contexto (medium)', () => {
    const r = buildRecommendation({ ...base, slowRate: 40 });
    assertGeneralRules(r);
    expect(r.priority).toBe('medium');
    expect(r.actions[0]).toMatch(/cache|contexto/i);
  });

  it('Caso 6 — tempo total alto com TTFT ok → mensagem sobre tamanho da resposta (medium)', () => {
    const r = buildRecommendation({ ...base, ttftP95: 1200, avgTotal: 5000 });
    assertGeneralRules(r);
    expect(r.priority).toBe('medium');
    expect(r.actions[0]).toMatch(/tamanho da resposta|demora a concluir/i);
  });

  it('Caso 7 — TTFT moderado → mensagem TTFT acima do ideal (medium)', () => {
    const r = buildRecommendation({ ...base, ttftP95: 1800 });
    assertGeneralRules(r);
    expect(r.priority).toBe('medium');
    expect(r.actions[0]).toMatch(/TTFT acima do ideal|pré-warming/i);
  });

  it('Caso 8 — abandono moderado → mensagem de reforço visual (medium)', () => {
    const r = buildRecommendation({ ...base, abandonRate: 15 });
    assertGeneralRules(r);
    expect(r.priority).toBe('medium');
    expect(r.actions[0]).toMatch(/feedback visual|abandono moderado/i);
  });

  it('Caso 9 — tudo ok → "Nenhuma ação necessária no momento." (low)', () => {
    const r = buildRecommendation({
      ttftP95: 900,
      avgTotal: 2000,
      abandonRate: 5,
      slowRate: 10,
      totalCalls: 100,
    });
    assertGeneralRules(r);
    expect(r.priority).toBe('low');
    expect(r.actions).toEqual(['Nenhuma ação necessária no momento.']);
  });

  describe('regras gerais (invariantes)', () => {
    const fixtures = [
      { name: 'sem dados', input: { ...base, totalCalls: 0 } },
      { name: 'crítico duplo', input: { ...base, ttftP95: 3000, abandonRate: 25 } },
      { name: 'abandono crítico', input: { ...base, abandonRate: 30 } },
      { name: 'ttft crítico', input: { ...base, ttftP95: 3000 } },
      { name: 'slow alto', input: { ...base, slowRate: 40 } },
      { name: 'total alto', input: { ...base, ttftP95: 1200, avgTotal: 5000 } },
      { name: 'ttft moderado', input: { ...base, ttftP95: 1800 } },
      { name: 'abandono moderado', input: { ...base, abandonRate: 15 } },
      { name: 'tudo ok', input: base },
      { name: 'ttftP95 null com dados', input: { ...base, ttftP95: null } },
    ];

    for (const { name, input } of fixtures) {
      it(`[${name}] sempre 1 ação, prioridade definida, mensagem não vazia`, () => {
        assertGeneralRules(buildRecommendation(input));
      });
    }
  });

  describe('hierarquia de prioridade', () => {
    it('crítico sempre vence médio (slowRate alto + ttft crítico → high)', () => {
      const r = buildRecommendation({ ...base, ttftP95: 3000, slowRate: 50 });
      expect(r.priority).toBe('high');
    });

    it('crítico sempre vence médio (abandono crítico + total alto → high)', () => {
      const r = buildRecommendation({ ...base, abandonRate: 25, avgTotal: 8000 });
      expect(r.priority).toBe('high');
    });

    it('médio vence baixo (slowRate alto sem crítico → medium, não low)', () => {
      const r = buildRecommendation({ ...base, slowRate: 35 });
      expect(r.priority).toBe('medium');
    });
  });
});
