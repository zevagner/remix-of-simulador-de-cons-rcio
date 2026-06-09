/**
 * Cross-Module Consistency Test
 * ════════════════════════════════════════════════════════════════════════
 * Garante que TODOS os módulos consumidores do `@/core/finance` produzam
 * os MESMOS números financeiros para os MESMOS inputs.
 *
 * Cada bloco simula o pipeline real de um módulo:
 *   • Simulator      → monthlySchedule + calculateSimulation + reconcile
 *   • PDF            → getEffectiveClientCost(monthlySchedule)
 *   • Investment     → calculateMonthlySchedule (paramétrico)
 *   • Comparator     → calculateSimulationLegacy (cenário paralelo)
 *
 * REGRA: para o MESMO input canônico, os pipelines devem produzir o MESMO
 * monthlySchedule (igualdade exata) e os MESMOS agregados reconciliados.
 * O agregado legado pode divergir dentro das tolerâncias oficiais
 * (ver mem://logic/simulador/divergencia-motores-tolerancias).
 */
import { describe, it, expect } from 'vitest';
import {
  calculateMonthlySchedule,
  calculateSimulation,
  calculateSimulationLegacy,
  reconcileWithSchedule,
  getEffectiveClientCost,
  deriveContemplationType,
  type MonthlyScheduleResult,
} from '@/core/finance';
import {
  DEFAULT_ADMIN_FEE,
  DEFAULT_RESERVE_FUND,
  DEFAULT_PROPONENT_AGE,
} from '@/config/consortiumRates';
import { PRESTAMISTA_RATE_CURRENT } from '@/core/finance/prestamista';
import type { ConsortiumType, SimulationInput } from '@/types/consortium';

interface Scenario {
  name: string;
  consortiumType: ConsortiumType;
  creditValue: number;
  termMonths: number;
  bidPercent: number;            // % do crédito como lance livre
  embeddedBidPercent?: number;
  contemplated: boolean;
  contemplationMonth: number;
  postChoice: 'reduce-installment' | 'reduce-term';
  age?: number;
}

const SCENARIOS: Scenario[] = [
  { name: 'Imobiliário padrão (sem lance, sem contemplação)',
    consortiumType: 'imobiliario', creditValue: 300000, termMonths: 180,
    bidPercent: 0, contemplated: false, contemplationMonth: 0,
    postChoice: 'reduce-installment' },

  { name: 'Imobiliário com lance livre 25%',
    consortiumType: 'imobiliario', creditValue: 300000, termMonths: 180,
    bidPercent: 25, contemplated: true, contemplationMonth: 18,
    postChoice: 'reduce-installment' },

  { name: 'Pós-contemplação reduzir prazo (auto, lance 30%)',
    consortiumType: 'auto', creditValue: 80000, termMonths: 80,
    bidPercent: 30, contemplated: true, contemplationMonth: 12,
    postChoice: 'reduce-term' },

  { name: 'Cenário investimento (imob. longo, sem lance, idade 35)',
    consortiumType: 'imobiliario', creditValue: 500000, termMonths: 240,
    bidPercent: 0, contemplated: false, contemplationMonth: 0,
    postChoice: 'reduce-installment', age: 35 },

  { name: 'Comparativo financiamento (imob. médio, lance livre 15%)',
    consortiumType: 'imobiliario', creditValue: 250000, termMonths: 200,
    bidPercent: 15, contemplated: true,
    contemplationMonth: 24, postChoice: 'reduce-installment' },
];

function buildInput(s: Scenario): SimulationInput {
  return {
    creditValue: s.creditValue,
    termMonths: s.termMonths,
    consortiumType: s.consortiumType,
    adminFeePercent: DEFAULT_ADMIN_FEE[s.consortiumType],
    reserveFundPercent: DEFAULT_RESERVE_FUND[s.consortiumType],
    insurancePercent: PRESTAMISTA_RATE_CURRENT * 100,
    proponentAge: s.age ?? DEFAULT_PROPONENT_AGE,
    reducedInstallment: false,
    freeBidValue: (s.creditValue * s.bidPercent) / 100,
    embeddedBidValue: (s.creditValue * (s.embeddedBidPercent ?? 0)) / 100,
  };
}

/** Pipeline Simulator: igual ao SimulatorContext (motor mensal + reconcile). */
function runSimulatorPipeline(s: Scenario, input: SimulationInput) {
  const ct = deriveContemplationType(s.contemplated, input.freeBidValue, input.embeddedBidValue);
  const schedule = calculateMonthlySchedule({
    sim: input,
    contemplated: s.contemplated,
    contemplationType: ct,
    contemplationMonth: s.contemplationMonth,
    postLanceChoice: s.postChoice,
  });
  const legacy = calculateSimulation(input, s.contemplated, s.postChoice, s.contemplationMonth);
  const reconciled = reconcileWithSchedule(legacy, schedule, input.termMonths);
  return { schedule, reconciled, effectiveCost: getEffectiveClientCost(schedule) };
}

/** Pipeline PDF: consome schedule do Simulator (sem recalcular). */
function runPdfPipeline(schedule: MonthlyScheduleResult) {
  return { effectiveCost: getEffectiveClientCost(schedule) };
}

/** Pipeline Investment: gera schedule paramétrico (mesmo motor). */
function runInvestmentPipeline(s: Scenario, input: SimulationInput) {
  const ct = deriveContemplationType(s.contemplated, input.freeBidValue, input.embeddedBidValue);
  return calculateMonthlySchedule({
    sim: input,
    contemplated: s.contemplated,
    contemplationType: ct,
    contemplationMonth: s.contemplationMonth,
    postLanceChoice: s.postChoice,
  });
}

/** Pipeline Comparator: cenário paralelo via legacy alias. */
function runComparatorPipeline(s: Scenario, input: SimulationInput) {
  return calculateSimulationLegacy(input, s.contemplated, s.postChoice, s.contemplationMonth);
}

/**
 * Tolerância: legado vs mensal (pós-Onda 2B).
 * Após unificação canônica do Prestamista, a divergência é puramente estrutural
 * (seguro decrescente vs constante). Magnitude real medida: 3–7% do totalPaid.
 *   • Sem lance, prazo < 200m:               ≤ 5%
 *   • Com lance OU prazo ≥ 200m:             ≤ 7%
 */
function legacyTolerance(s: Scenario): number {
  if (s.termMonths >= 200 || s.bidPercent > 0) return 0.07;
  return 0.05;
}

describe('Cross-Module Consistency — todos os módulos = mesmos números', () => {
  for (const s of SCENARIOS) {
    describe(s.name, () => {
      const input = buildInput(s);
      const sim = runSimulatorPipeline(s, input);
      const pdf = runPdfPipeline(sim.schedule);
      const inv = runInvestmentPipeline(s, input);
      const cmp = runComparatorPipeline(s, input);

      // ── 1. SCHEDULE: Simulator vs Investment (igualdade exata) ──
      it('schedule idêntico entre Simulator e Investment (motor mensal canônico)', () => {
        expect(inv.totalPaid).toBe(sim.schedule.totalPaid);
        expect(inv.totalInsurance).toBe(sim.schedule.totalInsurance);
        expect(inv.costWithInsurance).toBe(sim.schedule.costWithInsurance);
        expect(inv.effectiveClientCost).toBe(sim.schedule.effectiveClientCost);
        expect(inv.rows.length).toBe(sim.schedule.rows.length);
      });

      it('cronograma mês-a-mês idêntico (payment, insurance, balanceEnd)', () => {
        for (let i = 0; i < sim.schedule.rows.length; i++) {
          expect(inv.rows[i].payment).toBe(sim.schedule.rows[i].payment);
          expect(inv.rows[i].insurance).toBe(sim.schedule.rows[i].insurance);
          expect(inv.rows[i].balanceEnd).toBe(sim.schedule.rows[i].balanceEnd);
        }
      });

      // ── 2. PDF lê do mesmo schedule → custo efetivo idêntico ──
      it('PDF effectiveClientCost === Simulator effectiveClientCost', () => {
        expect(pdf.effectiveCost).toBe(sim.effectiveCost);
      });

      // ── 3. Reconcile: agregados batem com schedule ──
      it('reconcile.totalCost === schedule.costWithInsurance', () => {
        expect(sim.reconciled.totalCost).toBe(sim.schedule.costWithInsurance);
      });
      it('reconcile.insuranceTotal === schedule.totalInsurance', () => {
        expect(sim.reconciled.insuranceTotal).toBe(sim.schedule.totalInsurance);
      });

      // ── 4. Invariantes de domínio ──
      it('effectiveClientCost ≤ schedule.totalPaid (lance livre conta como desembolso)', () => {
        expect(sim.effectiveCost).toBeLessThanOrEqual(sim.schedule.totalPaid);
      });
      it('parcela inicial e final > 0', () => {
        expect(sim.schedule.rows[0].payment).toBeGreaterThan(0);
        const lastPaid = [...sim.schedule.rows].reverse().find((r) => r.baseInstallment > 0);
        expect(lastPaid?.payment ?? 0).toBeGreaterThan(0);
      });

      // ── 5. Comparator (legacy) dentro da tolerância oficial ──
      // Comparado contra schedule.totalPaid (mesma convenção do legado: parcelas + seguro + lance).
      it(`Comparator vs Simulator: custo total dentro de ${(legacyTolerance(s) * 100).toFixed(0)}%`, () => {
        const tol = legacyTolerance(s);
        const diff = Math.abs(cmp.totalCost - sim.schedule.totalPaid);
        expect(diff).toBeLessThanOrEqual(sim.schedule.totalPaid * tol);
      });
    });
  }
});
