import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PdfPieChart } from '../PdfPieChart';
import { BID_COLORS } from '@/components/modules/structured-ops/structuredOpsConstants';

/**
 * Garante paridade visual entre o gráfico "Composição dos Lances" do PDF e o da tela.
 * Cobre 3 cenários: 1 fatia (100%), 2 fatias e total zero.
 *
 * Regras protegidas:
 *  - cores devem bater com BID_COLORS da tela (tokens var(--caixa-blue)/var(--caixa-orange))
 *  - legendas devem usar `item.name` recebido (sem reescrever)
 *  - 1 fatia → renderiza <circle> (não <path>); 2 fatias → renderiza <path>
 *  - total zero → não renderiza fatia, mostra "Sem dados"
 */

const BLUE = BID_COLORS[0];
const ORANGE = BID_COLORS[1];

const buildBidPayload = (free: number, embedded: number) => {
  const total = free + embedded;
  if (total === 0) return [];
  return [
    { name: 'Lance Rec. Próprios', value: free, percent: (free / total) * 100, color: BLUE },
    { name: 'Lance Embutido', value: embedded, percent: (embedded / total) * 100, color: ORANGE },
  ].filter(i => i.value > 0);
};

describe('PdfPieChart — Composição dos Lances (paridade com a tela)', () => {
  it('cores do payload batem com BID_COLORS da tela', () => {
    expect(BID_COLORS[0]).toBe(BLUE);
    expect(BID_COLORS[1]).toBe(ORANGE);
  });

  it('cenário 1 fatia (100% recursos próprios) renderiza círculo sólido azul', () => {
    const items = buildBidPayload(50000, 0);
    expect(items).toHaveLength(1);
    expect(items[0].color).toBe(BLUE);

    const { container } = render(<PdfPieChart items={items} />);
    const circles = container.querySelectorAll('circle');
    const paths = container.querySelectorAll('path');
    expect(circles.length).toBe(1);
    expect(paths.length).toBe(0);
    expect(circles[0].getAttribute('fill')).toBe(BLUE);
    expect(container.textContent).toContain('Lance Rec. Próprios');
    expect(container.textContent).toContain('(100%)');
  });

  it('cenário 1 fatia (100% embutido) renderiza círculo sólido laranja', () => {
    const items = buildBidPayload(0, 30000);
    expect(items).toHaveLength(1);
    expect(items[0].color).toBe(ORANGE);

    const { container } = render(<PdfPieChart items={items} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(1);
    expect(circles[0].getAttribute('fill')).toBe(ORANGE);
    expect(container.textContent).toContain('Lance Embutido');
  });

  it('cenário 2 fatias renderiza dois paths com cores corretas e ambas legendas', () => {
    const items = buildBidPayload(40000, 10000);
    expect(items).toHaveLength(2);

    const { container } = render(<PdfPieChart items={items} />);
    const paths = container.querySelectorAll('path');
    const circles = container.querySelectorAll('circle');
    expect(paths.length).toBe(2);
    expect(circles.length).toBe(0);
    const fills = Array.from(paths).map(p => p.getAttribute('fill'));
    expect(fills).toEqual([BLUE, ORANGE]);
    expect(container.textContent).toContain('Lance Rec. Próprios');
    expect(container.textContent).toContain('Lance Embutido');
    expect(container.textContent).toContain('(80%)');
    expect(container.textContent).toContain('(20%)');
  });

  it('cenário total zero não renderiza fatias e mostra "Sem dados"', () => {
    const items = buildBidPayload(0, 0);
    expect(items).toHaveLength(0);

    const { container } = render(<PdfPieChart items={items} />);
    expect(container.querySelectorAll('path').length).toBe(0);
    expect(container.querySelectorAll('circle').length).toBe(0);
    expect(container.textContent).toContain('Sem dados');
  });
});
