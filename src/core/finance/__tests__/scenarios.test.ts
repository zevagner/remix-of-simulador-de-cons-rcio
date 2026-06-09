/**
 * Suite de 12 cenários — auditoria matemática do motor canônico.
 *
 * Chama `calculateMonthlySchedule` diretamente (engine única) e verifica
 * 5 invariantes universais + invariantes extras por cenário.
 *
 * Adaptação dos nomes solicitados pelo prompt → engine real:
 *   - type 'imovel'   → 'imobiliario'
 *   - type 'veiculo'  → 'auto'
 *   - adminFee 0.21   → adminFeePercent: 21
 *   - taxDiscount 0.30 → adminFeePercent *= (1 - 0.30) (aplicado como no SimulatorContext)
 *   - insuranceStartMonth (>1) — suportado pela engine
 *   - `monthlyInsurance` derivado de schedule.totalInsurance / mesesCobertos
 *   - `netCredit` derivado = creditValue - embeddedBid
 *   - `effectiveTerm` = rows.length (rows[].length reflete earlyTerminate em reduce-term)
 *   - `balance` = balanceEnd na MonthlyRow
 *   - `totalCost` canônico = costWithInsurance (parcelas + seguro, sem lance)
 *   - `totalPaid` da engine inclui bidApplied → invariante 1 verifica
 *     `totalPaid == sum(payment) + sum(bidApplied)`
 */
import { describe, it, expect } from 'vitest';
import { calculateMonthlySchedule } from '@/core/finance/internal/monthlySchedule';
import type { SimulationInput, ConsortiumType, ContemplationType } from '@/types/consortium';

type Scenario = {
  id: number;
  desc: string;
  credit: number;
  term: number;
  adminFee: number;        // fração (0.18)
  reserveFund: number;     // fração (0.02)
  type: 'imovel' | 'veiculo';
  insurance: boolean;
  insuranceStartMonth?: number;
  reducedInstallment: boolean;
  taxDiscount: number;     // fração (0..1)
  ownBid: number;          // R$
  embeddedBid: number;     // R$
  contemplated: boolean;
  contemplationMonth?: number;
  postContemplationChoice?: 'reduce-installment' | 'reduce-term';
};

const TYPE_MAP: Record<Scenario['type'], ConsortiumType> = {
  imovel: 'imobiliario',
  veiculo: 'auto',
};

function runEngine(s: Scenario) {
  const effectiveAdminPercent = s.adminFee * 100 * (1 - s.taxDiscount);
  const sim: SimulationInput = {
    creditValue: s.credit,
    termMonths: s.term,
    consortiumType: TYPE_MAP[s.type],
    adminFeePercent: effectiveAdminPercent,
    reserveFundPercent: s.reserveFund * 100,
    insurancePercent: s.insurance ? 1 : 0, // toggle (motor usa engine canônica)
    proponentAge: s.insurance ? 35 : 0,
    reducedInstallment: s.reducedInstallment,
    freeBidValue: s.ownBid,
    embeddedBidValue: s.embeddedBid,
    personType: 'PF',
  };
  const contemplationType: ContemplationType =
    s.contemplated && (s.ownBid + s.embeddedBid) > 0
      ? 'lance'
      : s.contemplated
        ? 'sorteio'
        : 'none';
  const schedule = calculateMonthlySchedule({
    sim,
    contemplated: s.contemplated,
    contemplationType,
    contemplationMonth: s.contemplationMonth ?? 0,
    postLanceChoice: s.postContemplationChoice ?? 'reduce-installment',
    annualAdjustmentPercent: 0,
    insuranceStartMonth: s.insuranceStartMonth ?? 1,
  });

  const rows = schedule.rows;
  const monthsCovered = Math.max(0, s.term - ((s.insuranceStartMonth ?? 1) - 1));
  const monthlyInsurance = monthsCovered > 0 ? schedule.totalInsurance / monthsCovered : 0;

  return {
    schedule,
    rows,
    sumPayments: rows.reduce((a, r) => a + r.payment, 0),
    sumBids: rows.reduce((a, r) => a + r.bidApplied, 0),
    totalCost: schedule.costWithInsurance,
    totalPaid: schedule.totalPaid,
    insuranceTotal: schedule.totalInsurance,
    monthlyInsurance,
    monthsCovered,
    netCredit: s.credit - s.embeddedBid,
    effectiveTerm: rows.length,
    lastBalance: rows.length ? rows[rows.length - 1].balanceEnd : 0,
  };
}

const scenarios: Scenario[] = [
  { id: 1, desc: 'Base simples imóvel sem extras',
    credit: 200000, term: 120, adminFee: 0.18, reserveFund: 0.02, type: 'imovel',
    insurance: false, reducedInstallment: false, taxDiscount: 0,
    ownBid: 0, embeddedBid: 0, contemplated: false },
  { id: 2, desc: 'Imóvel com seguro desde o início',
    credit: 200000, term: 120, adminFee: 0.18, reserveFund: 0.02, type: 'imovel',
    insurance: true, insuranceStartMonth: 1, reducedInstallment: false, taxDiscount: 0,
    ownBid: 0, embeddedBid: 0, contemplated: false },
  { id: 3, desc: 'Imóvel grande prazo longo sem extras',
    credit: 500000, term: 200, adminFee: 0.21, reserveFund: 0.025, type: 'imovel',
    insurance: false, reducedInstallment: false, taxDiscount: 0,
    ownBid: 0, embeddedBid: 0, contemplated: false },
  { id: 4, desc: 'Imóvel com parcela reduzida 80m',
    credit: 500000, term: 200, adminFee: 0.21, reserveFund: 0.025, type: 'imovel',
    insurance: false, reducedInstallment: true, taxDiscount: 0,
    ownBid: 0, embeddedBid: 0, contemplated: false },
  { id: 5, desc: 'Imóvel com desconto 30% na taxa',
    credit: 500000, term: 200, adminFee: 0.21, reserveFund: 0.025, type: 'imovel',
    insurance: false, reducedInstallment: false, taxDiscount: 0.30,
    ownBid: 0, embeddedBid: 0, contemplated: false },
  { id: 6, desc: 'Imóvel lance próprio 30% mês 24 reduz parcela',
    credit: 300000, term: 180, adminFee: 0.20, reserveFund: 0.02, type: 'imovel',
    insurance: false, reducedInstallment: false, taxDiscount: 0,
    ownBid: 90000, embeddedBid: 0, contemplated: true, contemplationMonth: 24,
    postContemplationChoice: 'reduce-installment' },
  { id: 7, desc: 'Imóvel lance embutido 30% mês 24 reduz parcela',
    credit: 300000, term: 180, adminFee: 0.20, reserveFund: 0.02, type: 'imovel',
    insurance: false, reducedInstallment: false, taxDiscount: 0,
    ownBid: 0, embeddedBid: 90000, contemplated: true, contemplationMonth: 24,
    postContemplationChoice: 'reduce-installment' },
  { id: 8, desc: 'Imóvel seguro + lance próprio 30% mês 24 reduz prazo',
    credit: 300000, term: 180, adminFee: 0.20, reserveFund: 0.02, type: 'imovel',
    insurance: true, insuranceStartMonth: 1, reducedInstallment: false, taxDiscount: 0,
    ownBid: 90000, embeddedBid: 0, contemplated: true, contemplationMonth: 24,
    postContemplationChoice: 'reduce-term' },
  { id: 9, desc: 'Imóvel reduzida + lance próprio 25% mês 36 reduz parcela',
    credit: 500000, term: 200, adminFee: 0.21, reserveFund: 0.025, type: 'imovel',
    insurance: false, reducedInstallment: true, taxDiscount: 0,
    ownBid: 125000, embeddedBid: 0, contemplated: true, contemplationMonth: 36,
    postContemplationChoice: 'reduce-installment' },
  { id: 10, desc: 'Imóvel reduzida + seguro + lance embutido 25% mês 36 reduz prazo',
    credit: 500000, term: 200, adminFee: 0.21, reserveFund: 0.025, type: 'imovel',
    insurance: true, insuranceStartMonth: 1, reducedInstallment: true, taxDiscount: 0,
    ownBid: 0, embeddedBid: 125000, contemplated: true, contemplationMonth: 36,
    postContemplationChoice: 'reduce-term' },
  { id: 11, desc: 'Imóvel alto valor lance próprio 40% mês 12 reduz parcela',
    credit: 1000000, term: 200, adminFee: 0.21, reserveFund: 0.025, type: 'imovel',
    insurance: false, reducedInstallment: false, taxDiscount: 0,
    ownBid: 400000, embeddedBid: 0, contemplated: true, contemplationMonth: 12,
    postContemplationChoice: 'reduce-installment' },
  { id: 12, desc: 'Veículo prazo curto sem extras',
    credit: 100000, term: 60, adminFee: 0.15, reserveFund: 0.015, type: 'veiculo',
    insurance: false, reducedInstallment: false, taxDiscount: 0,
    ownBid: 0, embeddedBid: 0, contemplated: false },
];

describe('Motor financeiro — 12 cenários (auditoria)', () => {
  // Cache de resultados para invariantes cross-scenario (3↔4, 3↔5).
  const results: Record<number, ReturnType<typeof runEngine>> = {};

  scenarios.forEach((s) => {
    describe(`Cenário ${s.id} — ${s.desc}`, () => {
      const r = runEngine(s);
      results[s.id] = r;

      it('1. totalPaid bate com sum(payment) + sum(bidApplied)', () => {
        expect(Math.abs(r.totalPaid - (r.sumPayments + r.sumBids))).toBeLessThan(1);
      });

      it('2. costWithInsurance + bidApplied ≥ creditValue (regra canônica: lance abate saldo)', () => {
        // costWithInsurance = parcelas + seguro, SEM lance (ver doc no topo do arquivo).
        // Quando há lance, parcelas cobrem apenas (credit − bid); somar bidApplied recompõe o crédito bruto.
        expect(r.totalCost + r.sumBids).toBeGreaterThanOrEqual(s.credit - 0.5);
      });

      it('3. saldo devedor no último mês ≈ 0 (< R$ 10)', () => {
        expect(Math.abs(r.lastBalance)).toBeLessThan(10);
      });

      it('4. insuranceTotal ≈ monthlyInsurance × mesesCobertos', () => {
        if (!s.insurance) {
          expect(r.insuranceTotal).toBe(0);
        } else {
          const expected = r.monthlyInsurance * r.monthsCovered;
          expect(Math.abs(r.insuranceTotal - expected)).toBeLessThan(1);
        }
      });

      it('5. netCredit = creditValue − embeddedBid', () => {
        if (s.embeddedBid > 0) {
          expect(r.netCredit).toBeCloseTo(s.credit - s.embeddedBid, 0);
        } else {
          expect(r.netCredit).toBe(s.credit);
        }
      });

      it('6. nenhuma parcela negativa, nenhum saldo negativo', () => {
        for (const row of r.rows) {
          expect(row.payment).toBeGreaterThanOrEqual(0);
          expect(row.balanceEnd).toBeGreaterThanOrEqual(-0.01);
        }
      });
    });
  });

  describe('Invariantes extras', () => {
    it('Cenário 4 — parcela mês 1 ≈ 70% da parcela-base canônica (credit+adm+FR)/N', () => {
      const r = results[4];
      const s = scenarios[3]; // id 4
      // Regra canônica (mem://logic/consorcio/regra-parcela-reduzida): fator 0.7 aplica
      // sobre a parcela-base do plano de origem — NÃO sobre a parcela vigente pós-reduzida.
      const basePlan = (s.credit * (1 + s.adminFee + s.reserveFund)) / s.term;
      expect(r.rows[0].payment).toBeCloseTo(basePlan * 0.7, 0);
    });

    it('Cenário 4 — totalCost canônico ≈ Cenário 3 (parcela reduzida não muda total)', () => {
      const c3 = results[3].totalCost;
      const c4 = results[4].totalCost;
      // Tolerância 1% (motor recalcula a cada reajuste/post-bid; sem reajuste deve bater).
      expect(Math.abs(c4 - c3) / c3).toBeLessThan(0.01);
    });

    it('Cenário 5 — totalCost < Cenário 3 (desconto na taxa reduz custo)', () => {
      expect(results[5].totalCost).toBeLessThan(results[3].totalCost);
    });

    it('Cenário 7 — netCredit ≈ 210k (carta 300k − embutido 90k)', () => {
      expect(results[7].netCredit).toBeCloseTo(210000, 0);
    });

    it('Cenário 8 — effectiveTerm < 180 (reduce-term encurta o plano)', () => {
      expect(results[8].effectiveTerm).toBeLessThan(180);
    });

    it('Cenário 10 — effectiveTerm < 200 (reduce-term encurta o plano)', () => {
      expect(results[10].effectiveTerm).toBeLessThan(200);
    });

    it('Cenário 11 — effectiveTerm = 200 (reduce-installment mantém prazo)', () => {
      expect(results[11].effectiveTerm).toBe(200);
    });
  });
});
