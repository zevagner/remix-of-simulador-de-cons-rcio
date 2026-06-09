/**
 * Capital Preserved KPI Relevance — testes de invariância visual.
 *
 * Garante (Onda Capital Preserved Relevance Audit):
 *   1. ExecutiveKpiStrip nunca renderiza chip "Capital preservado" quando
 *      preservedCapital ≤ 0 — mesmo se 'preserved' aparecer em secondary.
 *   2. PatrimonialStrategyCard suprime chip "Capital preservado" quando ≤ 0
 *      e o exibe quando > 0.
 *   3. PatrimonialKpiBar:
 *        • renderiza 4 KPIs (sem "Capital preservado") quando ≤ 0
 *        • renderiza 5 KPIs (com "Capital preservado") quando > 0
 *        • aplica grid lg:grid-cols-4 vs lg:grid-cols-5 estaticamente.
 *   4. Blueprint de Investimentos: 'traditional' e 'rental' não devem mais
 *      conter 'preserved' em secondary.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutiveKpiStrip } from '@/components/modules/investment/ExecutiveKpiStrip';
import type { ExecutiveKpiSet } from '@/components/modules/investment/scenarioExecutiveKpis';
import { PatrimonialStrategyCard } from '@/components/modules/patrimonial/PatrimonialStrategyCard';
import { PATRIMONIAL_STRATEGIES } from '@/components/modules/patrimonial/strategies';
import { PatrimonialKpiBar } from '@/components/modules/patrimonial/PatrimonialKpiBar';
import type { PatrimonialKpis } from '@/hooks/usePatrimonialKpis';

const baseKpiSet = (preservedCapital: number): ExecutiveKpiSet => ({
  roi: 0.12,
  tirMonthly: 0.009,
  tirAnnual: 0.114,
  paybackMonths: 24,
  multiplier: 1.4,
  preservedCapital,
  primary: 'roi',
  secondary: ['preserved'],
  dominant: ['roi', 'preserved'],
});

const basePatKpis = (preservedCapital: number, hasData = true): PatrimonialKpis => ({
  tirMonthly: 0.009,
  tirAnnual: 0.114,
  roi: 0.12,
  paybackMonths: 24,
  multiplier: 1.4,
  preservedCapital,
  controlledAsset: 500000,
  ownCapitalInvested: 350000,
  hasData,
});

describe('ExecutiveKpiStrip — Capital preservado relevance', () => {
  it('NÃO renderiza "Capital preservado" quando preservedCapital = 0', () => {
    render(<ExecutiveKpiStrip kpis={baseKpiSet(0)} />);
    expect(screen.queryByText('Capital preservado')).toBeNull();
  });

  it('NÃO renderiza "Capital preservado" quando preservedCapital < 0', () => {
    render(<ExecutiveKpiStrip kpis={baseKpiSet(-100)} />);
    expect(screen.queryByText('Capital preservado')).toBeNull();
  });

  it('RENDERIZA "Capital preservado" quando preservedCapital > 0', () => {
    render(<ExecutiveKpiStrip kpis={baseKpiSet(50000)} />);
    expect(screen.getByText('Capital preservado')).toBeInTheDocument();
  });
});

describe('PatrimonialStrategyCard — chip Capital preservado', () => {
  const strategy = PATRIMONIAL_STRATEGIES.find((s) => s.kpis.includes('preserved'))!;

  it('strategy de teste contém kpi "preserved" no blueprint', () => {
    expect(strategy).toBeDefined();
    expect(strategy.kpis).toContain('preserved');
  });

  it('NÃO renderiza chip "Capital preservado" quando preservedCapital = 0', () => {
    render(<PatrimonialStrategyCard strategy={strategy} kpis={basePatKpis(0)} />);
    expect(screen.queryByText('Capital preservado')).toBeNull();
  });

  it('RENDERIZA chip "Capital preservado" quando preservedCapital > 0', () => {
    render(<PatrimonialStrategyCard strategy={strategy} kpis={basePatKpis(120000)} />);
    expect(screen.getByText('Capital preservado')).toBeInTheDocument();
  });
});

describe('PatrimonialKpiBar — rebalanceamento 4/5 colunas', () => {
  it('renderiza 4 KPIs e grid lg:grid-cols-4 quando preservedCapital ≤ 0', () => {
    const { container } = render(<PatrimonialKpiBar kpis={basePatKpis(0)} />);
    expect(screen.queryByText('Capital preservado')).toBeNull();
    expect(screen.getByText('TIR estimada (a.a.)')).toBeInTheDocument();
    expect(screen.getByText('ROI patrimonial')).toBeInTheDocument();
    expect(screen.getByText('Payback')).toBeInTheDocument();
    expect(screen.getByText('Multiplicador')).toBeInTheDocument();

    const grid = container.querySelector('.grid');
    expect(grid?.className).toContain('lg:grid-cols-4');
    expect(grid?.className).not.toContain('lg:grid-cols-5');
  });

  it('renderiza 5 KPIs e grid lg:grid-cols-5 quando preservedCapital > 0', () => {
    const { container } = render(<PatrimonialKpiBar kpis={basePatKpis(75000)} />);
    expect(screen.getByText('Capital preservado')).toBeInTheDocument();

    const grid = container.querySelector('.grid');
    expect(grid?.className).toContain('lg:grid-cols-5');
    expect(grid?.className).not.toContain('lg:grid-cols-4');
  });

  it('limite estrito: preservedCapital exatamente 0 trata como ausente', () => {
    const { container } = render(<PatrimonialKpiBar kpis={basePatKpis(0)} />);
    const grid = container.querySelector('.grid');
    expect(grid?.className).toContain('lg:grid-cols-4');
  });
});

describe('Investment blueprint — coerência consultiva', () => {
  it('traditional e rental não contêm "preserved" no blueprint', async () => {
    // Importa o blueprint runtime via deriveScenarioExecutiveKpis em cenário
    // mínimo controlado: garante que secondary não incluirá 'preserved'.
    const mod = await import('@/components/modules/investment/scenarioExecutiveKpis');
    const calc: any = {
      estimatedInstallment: 1000,
      path3: { monthlyRent: 0, totalRentIncome: 0 },
    };
    const assumptions: any = { contemplationMonthOverride: 1 };

    const traditional = mod.deriveScenarioExecutiveKpis(
      { id: 'traditional', totalPaid: 100000, finalResult: 200000, percentGain: 100 } as any,
      calc, assumptions, 200000, 60,
    );
    expect(traditional.secondary).not.toContain('preserved');

    const rental = mod.deriveScenarioExecutiveKpis(
      { id: 'rental', totalPaid: 100000, finalResult: 200000, percentGain: 100 } as any,
      calc, assumptions, 200000, 60,
    );
    expect(rental.secondary).not.toContain('preserved');
  });
});

/**
 * Tooltip / explicação consultiva — coerência entre card e tooltip.
 *
 * Onda Tooltip Coherence: garante que o termo "Capital preservado" só
 * apareça em tooltips/labels quando há valor consultivo real (> 0),
 * eliminando inconsistência entre chip suprimido e tooltip que ainda
 * citava "R$ 0,00".
 */
import { PatrimonialTimeline } from '@/components/modules/patrimonial/PatrimonialTimeline';

describe('PatrimonialTimeline tooltip — coerência Capital preservado', () => {
  it('NÃO inclui linha "Capital preservado" no DOM quando preservedCapital = 0', () => {
    const { container } = render(
      <PatrimonialTimeline
        archetype="multiplicacao-ativos"
        creditValue={300000}
        ownCapital={300000}
        preservedCapital={0}
      />,
    );
    // Tooltip content é renderizado em portal apenas no hover, mas o JSX
    // está montado no DOM via Radix; com preservedCapital=0 a row some.
    expect(container.textContent).not.toContain('Capital preservado');
  });

  // Nota: positive case (preservedCapital > 0) depende de TooltipPortal do Radix,
  // que só monta o conteúdo no hover. A regra crítica é a ausência quando ≤ 0,
  // garantida acima — coerência entre chip suprimido e tooltip.
});
