import { describe, it, expect } from 'vitest';
import {
  recommend,
  pickBestScenario,
  validateSystem,
} from '@/utils/decisionEngine';

describe('decisionEngine.recommend — Diagnóstico', () => {
  it('não permite compra à vista quando capital não declarado', () => {
    const r = recommend({
      objetivoPrincipal: 'imovel_moradia',
      capacidadeMensal: 3000,
      temCapitalDisponivel: false,
      capitalDisponivel: 0,
      prioridade: 'menor_parcela',
      urgencia: 'curto_prazo',
    });
    expect(r.allowCashPurchase).toBe(false);
  });

  it('não permite compra à vista quando capital declarado é zero', () => {
    const r = recommend({
      objetivoPrincipal: 'imovel_moradia',
      capacidadeMensal: 3000,
      temCapitalDisponivel: true,
      capitalDisponivel: 0,
      prioridade: 'menor_parcela',
      urgencia: 'curto_prazo',
    });
    expect(r.allowCashPurchase).toBe(false);
  });
});

describe('decisionEngine.recommend — Motor de decisão', () => {
  it('urgência imediata despriorizado consórcio', () => {
    const r = recommend({
      objetivoPrincipal: 'imovel_moradia',
      capacidadeMensal: 3000,
      temCapitalDisponivel: false,
      capitalDisponivel: 0,
      prioridade: 'rapidez',
      urgencia: 'imediato',
    });
    expect(r.prioritizeConsorcio).toBe(false);
    expect(r.recommendedPath).toBe('financiamento');
  });

  it('imediato com capital → compra à vista', () => {
    const r = recommend({
      objetivoPrincipal: 'imovel_moradia',
      capacidadeMensal: 3000,
      temCapitalDisponivel: true,
      capitalDisponivel: 500000,
      prioridade: 'rapidez',
      urgencia: 'imediato',
    });
    expect(r.recommendedPath).toBe('compra_a_vista');
  });

  it('sem pressa sem capital → consórcio puro', () => {
    const r = recommend({
      objetivoPrincipal: 'imovel_moradia',
      capacidadeMensal: 3000,
      temCapitalDisponivel: false,
      capitalDisponivel: 0,
      prioridade: 'menor_custo',
      urgencia: 'sem_pressa',
    });
    expect(r.recommendedPath).toBe('consorcio');
  });

  it('sem pressa com capital → consórcio com lance', () => {
    const r = recommend({
      objetivoPrincipal: 'imovel_moradia',
      capacidadeMensal: 3000,
      temCapitalDisponivel: true,
      capitalDisponivel: 80000,
      prioridade: 'menor_custo',
      urgencia: 'curto_prazo',
    });
    expect(r.recommendedPath).toBe('consorcio_com_lance');
  });
});

describe('decisionEngine.recommend — Analysis', () => {
  it('objetivo "investimento" → caminho financeiro', () => {
    const r = recommend({
      objetivoPrincipal: 'investimento',
      capacidadeMensal: 5000,
      temCapitalDisponivel: true,
      capitalDisponivel: 100000,
      prioridade: 'menor_custo',
      urgencia: 'sem_pressa',
    });
    expect(r.recommendedPath).toBe('investimento_financeiro');
    expect(r.prioritizeConsorcio).toBe(false);
  });
});

describe('decisionEngine.recommend — Raízes produtivas (Wave Integration)', () => {
  const base = {
    capacidadeMensal: 8000,
    temCapitalDisponivel: false,
    capitalDisponivel: 0,
    prioridade: 'menor_custo' as const,
    urgencia: 'curto_prazo' as const,
  };

  it('patrimônio produtivo (default) → consórcio imobiliário', () => {
    const r = recommend({ ...base, objetivoPrincipal: 'patrimonio_produtivo' });
    expect(r.recommendedPath).toBe('consorcio_imobiliario');
  });

  it('patrimônio produtivo + máquinas → consórcio pesados', () => {
    const r = recommend({ ...base, objetivoPrincipal: 'patrimonio_produtivo', subObjetivo: 'maquinas_implementos' });
    expect(r.recommendedPath).toBe('consorcio_pesados');
  });

  it('expandir operação (default) → consórcio pesados', () => {
    const r = recommend({ ...base, objetivoPrincipal: 'expandir_operacao' });
    expect(r.recommendedPath).toBe('consorcio_pesados');
  });

  it('expandir operação + sede/galpão → consórcio imobiliário', () => {
    const r = recommend({ ...base, objetivoPrincipal: 'expandir_operacao', subObjetivo: 'sede_galpao' });
    expect(r.recommendedPath).toBe('consorcio_imobiliario');
  });
});

describe('decisionEngine.pickBestScenario — Investment', () => {
  it('retorna cenário com maior percentGain', () => {
    const best = pickBestScenario([
      { id: 'a', name: 'A', percentGain: 12 },
      { id: 'b', name: 'B', percentGain: 18 },
      { id: 'c', name: 'C', percentGain: 9 },
    ]);
    expect(best.id).toBe('b');
  });

  it('lista vazia lança erro', () => {
    expect(() => pickBestScenario([])).toThrow();
  });
});

describe('validateSystem', () => {
  it('todos os cenários críticos passam', () => {
    const report = validateSystem();
    if (!report.ok) {
      // eslint-disable-next-line no-console
      console.error('Falhas:', report.failures);
    }
    expect(report.ok).toBe(true);
    expect(report.failures).toHaveLength(0);
  });
});
