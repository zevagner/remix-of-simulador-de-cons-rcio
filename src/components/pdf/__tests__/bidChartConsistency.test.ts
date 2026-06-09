import { describe, it, expect } from 'vitest';
import { checkBidChartConsistency, CANONICAL_BID_COLOR_MAP } from '../bidChartConsistency';
import { BID_COLORS } from '@/components/modules/structured-ops/structuredOpsConstants';

// Onda token migration: BID_COLORS migrou de hex (#005CA9/#F39200) para
// design tokens CSS (var(--caixa-blue)/var(--caixa-orange)). Os testes
// referenciam os tokens via BID_COLORS para evitar drift hex/token.
const BLUE = BID_COLORS[0];
const ORANGE = BID_COLORS[1];

describe('checkBidChartConsistency', () => {
  it('aprova payload canônico (2 fatias com cores corretas)', () => {
    const r = checkBidChartConsistency([
      { name: 'Lance Rec. Próprios', value: 40000, color: BLUE },
      { name: 'Lance Embutido', value: 10000, color: ORANGE },
    ]);
    expect(r.ok).toBe(true);
    expect(r.issues).toHaveLength(0);
  });

  it('aprova payload de 1 fatia (100%)', () => {
    const r = checkBidChartConsistency([
      { name: 'Lance Rec. Próprios', value: 50000, color: BLUE },
    ]);
    expect(r.ok).toBe(true);
  });

  it('aprova lista vazia (cenário sem lance)', () => {
    expect(checkBidChartConsistency([]).ok).toBe(true);
  });

  it('detecta cor divergente do canônico da tela', () => {
    const r = checkBidChartConsistency([
      { name: 'Lance Rec. Próprios', value: 1, color: '#FF0000' },
    ]);
    expect(r.ok).toBe(false);
    expect(r.issues[0].kind).toBe('color_mismatch');
    expect(r.issues[0].expected).toBe(BLUE);
    expect(r.issues[0].received).toBe('#FF0000');
  });

  it('detecta ausência de cor', () => {
    const r = checkBidChartConsistency([
      { name: 'Lance Embutido', value: 1 },
    ]);
    expect(r.ok).toBe(false);
    expect(r.issues[0].kind).toBe('missing_color');
  });

  it('detecta rótulo desconhecido (renomeação acidental)', () => {
    const r = checkBidChartConsistency([
      { name: 'Lance Próprio', value: 1, color: BLUE },
    ]);
    expect(r.ok).toBe(false);
    expect(r.issues[0].kind).toBe('unknown_label');
  });

  it('mapa canônico tem exatamente as duas cores BID_COLORS', () => {
    expect(CANONICAL_BID_COLOR_MAP['Lance Rec. Próprios']).toBe(BLUE);
    expect(CANONICAL_BID_COLOR_MAP['Lance Embutido']).toBe(ORANGE);
  });
});
