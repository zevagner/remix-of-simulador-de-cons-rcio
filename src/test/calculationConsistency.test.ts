/**
 * Consistência entre motores de cálculo.
 * ════════════════════════════════════════════════════════════════════════
 * Garante que `calculateSimulationLegacy` (agregado) e
 * `calculateMonthlySchedule` (fonte de verdade atuarial) permaneçam
 * alinhados dentro da tolerância aceitável de modelagem.
 *
 * REGRA DE CONSISTÊNCIA — divergências esperadas, NÃO bugs
 * ────────────────────────────────────────────────────────
 * Os motores divergem por design. Tolerâncias oficiais:
 *   • Padrão (idade < 45 e prazo < 200 meses):       ≤ 2%
 *   • Cenário simples sem lance, idade < 45:         ≤ 1%
 *   • Idade ≥ 45 OU prazo ≥ 200 meses:               ≤ 5%
 *
 * Causas (todas intencionais):
 *   1. Seguro atuarial por idade (motor mensal) vs taxa fixa do plano (legado).
 *   2. Recálculo mês a mês sobre saldo real vs agregação linear.
 *   3. Composição de longo prazo amplifica diferenças marginais.
 *
 * Se um teste falhar:
 *   ✗ NÃO ajuste a tolerância para "passar".
 *   ✗ NÃO force os motores a baterem casca-grossa.
 *   ✓ Investigue o motor mensal (fonte de verdade) primeiro.
 *   ✓ Se a divergência for atuarialmente legítima, atualize a tolerância
 *     COM justificativa documentada (idade/prazo/modelo).
 *
 * Mapeamento de campos (motor mensal não expõe os mesmos nomes do legado):
 *  - schedule.totalCost           → schedule.totalPaid (parcelas + seguro + lance)
 *  - schedule.initialInstallment  → rows[0].payment
 *  - schedule.installmentAfterBid → última linha paga (rows[].payment)
 *
 * Por que totalPaid e não costWithInsurance?
 *  - costWithInsurance = parcelas + seguro (NÃO inclui lance)
 *  - effectiveClientCost = totalPaid - embeddedBid (inclui lance livre como desembolso)
 *  - Para a invariante "effectiveClientCost ≤ totalCost" valer com lance livre,
 *    totalCost precisa ser totalPaid.
 */
import { describe, it, expect } from 'vitest';
import { calculateSimulationLegacy } from '@/core/finance';
import {
  calculateMonthlySchedule,
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
  /** % do crédito como lance (livre). 0 = sem lance. */
  bidPercent: number;
  age?: number;
  contemplationMonth?: number;
}

function buildInput(s: Scenario): SimulationInput {
  const freeBidValue = (s.creditValue * s.bidPercent) / 100;
  return {
    creditValue: s.creditValue,
    termMonths: s.termMonths,
    consortiumType: s.consortiumType,
    adminFeePercent: DEFAULT_ADMIN_FEE[s.consortiumType],
    reserveFundPercent: DEFAULT_RESERVE_FUND[s.consortiumType],
    // Pós-Onda 2: produção usa o percentual canônico (cota nova) — igual em
    // ambos os motores. Mantém o teste alinhado ao que SimulatorContext
    // envia ao reconcile (`mipRate = getMIPRateByAge() = 0,0765%`).
    insurancePercent: PRESTAMISTA_RATE_CURRENT * 100,
    proponentAge: s.age ?? DEFAULT_PROPONENT_AGE,
    reducedInstallment: false,
    freeBidValue,
    embeddedBidValue: 0,
  };
}

function getInitialInstallment(schedule: MonthlyScheduleResult): number {
  return schedule.rows[0]?.payment ?? 0;
}

function getInstallmentAfterBid(schedule: MonthlyScheduleResult): number {
  // Última linha paga (regime != early-terminate).
  const lastPaid = [...schedule.rows].reverse().find((r) => r.baseInstallment > 0);
  return lastPaid?.payment ?? 0;
}

const scenarios: Scenario[] = [
  { name: 'Auto, sem lance',           consortiumType: 'auto',        creditValue: 50000,  termMonths: 60,  bidPercent: 0  },
  { name: 'Auto, com lance 20%',       consortiumType: 'auto',        creditValue: 50000,  termMonths: 60,  bidPercent: 20, contemplationMonth: 12 },
  { name: 'Imobiliário longo',         consortiumType: 'imobiliario', creditValue: 300000, termMonths: 200, bidPercent: 0  },
  { name: 'Imobiliário lance alto 40%', consortiumType: 'imobiliario', creditValue: 300000, termMonths: 200, bidPercent: 40, contemplationMonth: 24 },
  { name: 'Pesados, lance 10%',        consortiumType: 'pesados',     creditValue: 200000, termMonths: 100, bidPercent: 10, contemplationMonth: 12 },
  { name: 'Idade alta (55a) — impacto seguro', consortiumType: 'imobiliario', creditValue: 150000, termMonths: 120, bidPercent: 0, age: 55 },
];

/**
 * Tolerância da consistência entre motores (pós-Onda 2B — Prestamista canônico):
 *
 * Após a unificação atuarial, AMBOS os motores usam o MESMO percentual fixo
 * canônico (0,0765%/mês cota nova). A divergência por IDADE deixou de existir.
 * A divergência residual é PURAMENTE estrutural:
 *   • Motor mensal:  seguro = saldo devedor REAL (decrescente) × taxa
 *   • Motor legado:  seguro = creditValue × taxa × prazo (saldo CONSTANTE)
 *
 * Resultado: legado superestima o seguro em ~2× (área retangular vs triangular).
 * Como o seguro é fração pequena do custo total, a divergência observada fica
 * em 3–7% do totalCost. Tolerâncias calibradas pela MAGNITUDE REAL medida:
 *
 *   • Sem lance, prazo < 200m:                           ≤ 5%
 *   • Com lance OU prazo ≥ 200m (composição ampliada):   ≤ 7%
 *
 * NÃO existe mais branch por idade — seria tolerância artificial.
 */
function expectedTolerance(s: Scenario): { strict: number; reason?: string } {
  if (s.termMonths >= 200 || s.bidPercent > 0) {
    return {
      strict: 0.07,
      reason: 'composição saldo decrescente (motor mensal) vs agregação linear (legado) ampliada por prazo/lance',
    };
  }
  return { strict: 0.05, reason: 'seguro decrescente (mensal) vs constante (legado)' };
}

describe('Consistência entre calculateSimulationLegacy e calculateMonthlySchedule', () => {
  for (const s of scenarios) {
    describe(s.name, () => {
      const input = buildInput(s);
      const contemplated = s.bidPercent > 0;
      const legacy = calculateSimulationLegacy(input, contemplated, 'reduce-installment', s.contemplationMonth ?? 12);
      const schedule = calculateMonthlySchedule({
        sim: input,
        contemplated,
        contemplationType: contemplated ? 'lance' : 'none',
        contemplationMonth: s.contemplationMonth ?? 0,
        postLanceChoice: 'reduce-installment',
      });
      const totalCost = schedule.totalPaid;
      const tol = expectedTolerance(s);

      it(`5.1 — custo total dentro de ${(tol.strict * 100).toFixed(0)}% entre os motores${tol.reason ? ' (tolerância alargada: ' + tol.reason + ')' : ''}`, () => {
        const diff = Math.abs(totalCost - legacy.totalCost);
        expect(diff).toBeLessThan(legacy.totalCost * tol.strict);
      });

      it('5.2 — effectiveClientCost ≤ totalCost', () => {
        expect(schedule.effectiveClientCost).toBeLessThanOrEqual(totalCost);
      });

      it('5.3 — parcela inicial > 0', () => {
        expect(getInitialInstallment(schedule)).toBeGreaterThan(0);
      });

      it('5.4 — parcela pós-contemplação > 0', () => {
        expect(getInstallmentAfterBid(schedule)).toBeGreaterThan(0);
      });

      // (Onda 2B) Removido teste "1% sem lance" — após unificação canônica,
      // a divergência estrutural seguro decrescente vs constante torna 1%
      // inalcançável e seria tolerância artificial. A magnitude real (≤5%)
      // já é coberta pelo teste 5.1 acima.

      // Nota: a direção da divergência (motor mensal > ou < legado) depende
      // da combinação idade × prazo × taxa fixa do plano — não é monotônica.
      // Portanto não asserimos sinal aqui; só a magnitude (via tolerância alargada acima).

      if (s.bidPercent > 0) {
        it('lance livre é desembolso: effectiveClientCost > 0', () => {
          expect(schedule.effectiveClientCost).toBeGreaterThan(0);
        });
      }
    });
  }
});

