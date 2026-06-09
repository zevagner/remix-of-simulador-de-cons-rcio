/**
 * KPI Signatures — Regression Sweep
 *
 * Percorre TODOS os cenários de Investimento (SCENARIO_KPI_BLUEPRINT) e
 * TODAS as estratégias de Engenharia Patrimonial (PATRIMONIAL_STRATEGIES)
 * e valida automaticamente:
 *   1. Densidade máxima — nenhum card excede o teto institucional.
 *   2. Tese × KPIs proibidos — KPIs sem valor consultivo NÃO podem
 *      reaparecer em estratégias onde foram explicitamente removidos.
 *   3. Cobertura — todo cenário/estratégia conhecido tem entrada.
 *   4. Sem duplicatas dentro do mesmo card.
 *
 * Esta sweep complementa os testes específicos por estratégia, garantindo
 * que futuras evoluções não voltem a inflar a densidade cognitiva nem
 * reintroduzam KPIs descartados pela auditoria.
 */
import { describe, it, expect } from 'vitest';
import {
  SCENARIO_KPI_BLUEPRINT,
  type ExecutiveKpiKind,
} from '@/components/modules/investment/scenarioExecutiveKpis';
import {
  PATRIMONIAL_STRATEGIES,
  type PatrimonialKpiKind,
} from '@/components/modules/patrimonial/strategies';

// ── Tetos institucionais (alinhados às ondas de auditoria) ──
const INVESTMENT_MAX_TOTAL = 3;        // 1 primary + até 2 secondary
const INVESTMENT_MAX_SECONDARY = 2;
const PATRIMONIAL_MAX_TOTAL = 3;       // somente "multiplicacao-ativos" usa 3

// ── KPIs proibidos por tese — fonte: auditoria documentada inline ──
const INVESTMENT_FORBIDDEN: Record<string, ExecutiveKpiKind[]> = {
  // Carta como aplicação financeira: sem ativo a recuperar; capital fica em caixa.
  investment:              ['payback', 'preserved'],
  // Aquisição tradicional: vivência longa, sem fluxo recorrente, sem lance embutido.
  traditional:             ['roi', 'tir', 'payback', 'preserved'],
  // Venda da cota: horizonte curto — TIR/Multiplicador/Preservado não fazem sentido.
  sale:                    ['tir', 'multiplier', 'preserved'],
  // Aluguel: renda já é a métrica narrada; sem lance embutido = preserved zero.
  rental:                  ['roi', 'tir', 'preserved'],
  // Antecipar contemplação: foco "valeu o lance?".
  'quick-contemplation':   ['tir', 'payback', 'multiplier'],
  // Previdência turbinada: foco em capitalização do crédito.
  'previdencia-turbinada': ['tir', 'payback', 'preserved'],
};

const PATRIMONIAL_FORBIDDEN: Record<string, PatrimonialKpiKind[]> = {
  autoquitacao:             ['roi', 'tir', 'preserved'],
  'escada-patrimonial':     ['payback', 'roi', 'preserved'],
  'renda-passiva':          ['multiplier', 'tir', 'preserved'],
  'construcao-inteligente': ['payback', 'tir', 'preserved'],
  // Multiplicação de Ativos é a única que carrega 'preserved' + 'tir' juntos.
  'multiplicacao-ativos':   ['payback', 'roi'],
  'holding-sucessao':       ['roi', 'payback', 'tir'],
};

// ─────────────────────────────────────────────────────────────────────
describe('KPI Signatures Regression — Investimentos (cenários)', () => {
  const scenarioIds = Object.keys(SCENARIO_KPI_BLUEPRINT);

  it('cobertura: blueprint cobre os 6 cenários conhecidos', () => {
    expect(scenarioIds.sort()).toEqual(
      ['investment', 'previdencia-turbinada', 'quick-contemplation', 'rental', 'sale', 'traditional'].sort()
    );
  });

  for (const id of Object.keys(SCENARIO_KPI_BLUEPRINT)) {
    const bp = SCENARIO_KPI_BLUEPRINT[id];
    const all: ExecutiveKpiKind[] = [bp.primary, ...bp.secondary];

    describe(`cenário "${id}"`, () => {
      it(`densidade ≤ ${INVESTMENT_MAX_TOTAL} KPIs (1 primary + ${INVESTMENT_MAX_SECONDARY} secondary máx)`, () => {
        expect(bp.secondary.length).toBeLessThanOrEqual(INVESTMENT_MAX_SECONDARY);
        expect(all.length).toBeLessThanOrEqual(INVESTMENT_MAX_TOTAL);
      });

      it('sem duplicatas (primary ∉ secondary)', () => {
        expect(bp.secondary).not.toContain(bp.primary);
        expect(new Set(all).size).toBe(all.length);
      });

      it('respeita lista de KPIs proibidos por tese', () => {
        const forbidden = INVESTMENT_FORBIDDEN[id] ?? [];
        for (const kpi of forbidden) {
          expect(all, `cenário "${id}" não deve exibir "${kpi}"`).not.toContain(kpi);
        }
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────
describe('KPI Signatures Regression — Engenharia Patrimonial', () => {
  it('cobertura: 6 estratégias mapeadas', () => {
    expect(PATRIMONIAL_STRATEGIES).toHaveLength(6);
    expect(Object.keys(PATRIMONIAL_FORBIDDEN).sort())
      .toEqual(PATRIMONIAL_STRATEGIES.map((s) => s.id).sort());
  });

  for (const s of PATRIMONIAL_STRATEGIES) {
    describe(`estratégia "${s.id}"`, () => {
      it(`densidade ≤ ${PATRIMONIAL_MAX_TOTAL} KPIs`, () => {
        expect(s.kpis.length).toBeLessThanOrEqual(PATRIMONIAL_MAX_TOTAL);
        expect(s.kpis.length).toBeGreaterThanOrEqual(2);
      });

      it('sem duplicatas no card', () => {
        expect(new Set(s.kpis).size).toBe(s.kpis.length);
      });

      it('respeita lista de KPIs proibidos por tese', () => {
        const forbidden = PATRIMONIAL_FORBIDDEN[s.id] ?? [];
        for (const kpi of forbidden) {
          expect(s.kpis, `estratégia "${s.id}" não deve exibir "${kpi}"`).not.toContain(kpi);
        }
      });
    });
  }

  it('apenas "multiplicacao-ativos" usa 3 KPIs (resto = 2)', () => {
    const threeKpi = PATRIMONIAL_STRATEGIES.filter((s) => s.kpis.length === 3).map((s) => s.id);
    expect(threeKpi).toEqual(['multiplicacao-ativos']);
  });
});
