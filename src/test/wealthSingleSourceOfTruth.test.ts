/**
 * ════════════════════════════════════════════════════════════════════════════
 * WEALTH SSoT — Testes de Invariância
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Garante que as 24 estratégias patrimoniais SÓ produzem matemática quando
 * existe `ctx.sim` válido (snapshot canônico do Simulador). Qualquer
 * regressão que reintroduza shadow engine é detectada aqui.
 *
 * Invariâncias cobertas:
 *   1. simSlice = null  ⇒  toda calculation retorna o placeholder "—".
 *   2. Mudar o snapshot do Simulador altera o resultado das estratégias.
 *   3. Mudar `creditValue` SEM mudar o snapshot NÃO altera o custo do plano
 *      (engine paralela quebraria isso).
 *   4. Source-grep negativo: o arquivo de dados não contém `ADM_TOTAL` /
 *      `PARCELA_FATOR` / `DEFAULT_REFERENCE_CREDIT` / `REF_<UPPER>`.
 * ════════════════════════════════════════════════════════════════════════════
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  STRATEGY_LIBRARY,
  type StrategyCalcContext,
  type SimSliceShape,
} from '@/components/modules/wealth/strategyLibraryData';

/* ── Helpers ─────────────────────────────────────────────────────────── */

const NA = '—';

function makeCalcCtx(sim: SimSliceShape | null): StrategyCalcContext {
  return {
    cdiAnnual: 0.149,
    cdiGrossAnnual: 0.149 * 1.1,
    cdiAnnualLiq: 0.149 * 0.85,
    cdiMonthlyLiq: 0.01,
    contemplationMonth: 12,
    analysisMonths: 200,
    monthsAfterContemplation: 188,
    propertyAppreciation: 0.06,
    rentalYield: 0.005,
    agioOnSale: 0,
    discountOnSale: 0,
    tipoVendaCarta: 'carta-contemplada',
    sim,
    fullInstallment: sim?.fullInstallment,
  };
}

function makeSim(overrides: Partial<SimSliceShape> = {}): SimSliceShape {
  const base: SimSliceShape = {
    creditValue: 300_000,
    consortiumType: 'imobiliario',
    termMonths: 200,
    adminFeePercent: 21,
    adminFeeDiscountPercent: 0,
    reserveFundPercent: 2.5,
    insuranceEnabled: true,
    insurancePercent: 0.0765,
    annualAdjustmentPercent: 6,
    embeddedBidPercent: 0,
    freeBidPercent: 0,
    contemplationMonth: 12,
    effectiveAdminFeePercent: 21,
    effectiveInsurancePercent: 0.0765,
    costPlan: 370_500,        // 300k × (1 + 0.21 + 0.025)
    totalInsurance: 18_000,
    totalCost: 388_500,
    fullInstallment: 1_942,   // 388_500 / 200
    effectiveClientCost: 388_500,
  };
  return Object.freeze({ ...base, ...overrides });
}

/* ── Suite ───────────────────────────────────────────────────────────── */

/** Labels que denotam CUSTO/PARCELA do consórcio (devem vir de ctx.sim.*). */
const COST_LABEL_PATTERN = /\b(custo|parcela|plano|adm|fr|fundo reserva|seguro|total)\b/i;

describe('Wealth SSoT — invariâncias', () => {
  it('Invariância 1: simSlice=null ⇒ NENHUM cálculo de CUSTO produz número', () => {
    const ctx = makeCalcCtx(null);
    const offenders: Array<{ id: string; label: string; out: string }> = [];

    for (const strategy of STRATEGY_LIBRARY) {
      for (const calc of strategy.calculations) {
        if (!COST_LABEL_PATTERN.test(calc.label)) continue;
        const out = calc.result(300_000, ctx);
        if (!out.includes(NA)) {
          offenders.push({ id: strategy.id, label: calc.label, out });
        }
      }
    }

    if (offenders.length > 0) {
      const sample = offenders.slice(0, 5)
        .map((o) => `  · ${o.id} → "${o.label}" = "${o.out}"`)
        .join('\n');
      throw new Error(
        `Wealth SSoT QUEBRADA: ${offenders.length} cálculo(s) de CUSTO ` +
        `produzem número sem sim.\n${sample}`,
      );
    }
    expect(offenders).toHaveLength(0);
  });

  it('Invariância 2: alterar o snapshot do Simulador altera o resultado das estratégias', () => {
    const simA = makeSim({ costPlan: 370_500, totalCost: 388_500, fullInstallment: 1_942 });
    const simB = makeSim({ costPlan: 500_000, totalCost: 520_000, fullInstallment: 2_600 });
    const ctxA = makeCalcCtx(simA);
    const ctxB = makeCalcCtx(simB);

    const sampleIds = [
      'aquisicao-acelerada', 'compra-planejada',
      'leverage-patrimonial', 'multiplicacao-cotas',
    ];

    let changed = 0;
    for (const id of sampleIds) {
      const s = STRATEGY_LIBRARY.find((x) => x.id === id);
      if (!s) continue;
      for (const calc of s.calculations) {
        if (calc.result(300_000, ctxA) !== calc.result(300_000, ctxB)) {
          changed++;
          break;
        }
      }
    }
    expect(changed).toBeGreaterThan(0);
  });

  it('Invariância 3: CUSTO de plano NÃO deriva de credit (com sim constante)', () => {
    const sim = makeSim();
    const ctx = makeCalcCtx(sim);
    const offenders: Array<{ id: string; label: string; a: string; b: string }> = [];

    for (const strategy of STRATEGY_LIBRARY) {
      for (const calc of strategy.calculations) {
        if (!COST_LABEL_PATTERN.test(calc.label)) continue;
        const a = calc.result(300_000, ctx);
        const b = calc.result(900_000, ctx);
        if (a !== b && a.includes('R$') && b.includes('R$')) {
          offenders.push({ id: strategy.id, label: calc.label, a, b });
        }
      }
    }

    expect(
      offenders.length,
      `Shadow engine de CUSTO detectada:\n${JSON.stringify(offenders.slice(0, 5), null, 2)}`,
    ).toBe(0);
  });

  it('Invariância 4: source-grep negativo em strategyLibraryData.ts', () => {
    const path = join(process.cwd(), 'src/components/modules/wealth/strategyLibraryData.ts');
    const src = readFileSync(path, 'utf8');
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((l) => l.replace(/\/\/.*$/, ''))
      .join('\n');
    const forbiddenIdent = /(\bADM_TOTAL\b|\bPARCELA_FATOR\b|\bDEFAULT_REFERENCE_CREDIT\b|\bREF_[A-Z][A-Z0-9_]*\b)/g;
    const matches = stripped.match(forbiddenIdent) ?? [];
    expect(matches, `Identificadores shadow engine encontrados: ${matches.join(', ')}`)
      .toEqual([]);
  });
});
