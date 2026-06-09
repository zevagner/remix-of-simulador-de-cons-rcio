import { describe, it, expect } from "vitest";
import { calculateSimulation, calculateFinancingCost } from "@/core/finance";
import { SimulationInput } from "@/types/consortium";
import { getMIPRateByAge, isValidProponentAge } from "@/utils/mipRates";

describe("calculateSimulation", () => {
  const baseInput: SimulationInput = {
    creditValue: 300000,
    termMonths: 180,
    consortiumType: "imobiliario",
    adminFeePercent: 16,
    reserveFundPercent: 3,
    insurancePercent: 0.05,
    proponentAge: 30,
    reducedInstallment: false,
    freeBidValue: 0,
    embeddedBidValue: 0,
  };

  it("guard clause: termMonths=0 returns zeroed result", () => {
    const result = calculateSimulation({ ...baseInput, termMonths: 0 });
    expect(result.totalCost).toBe(0);
    expect(result.installmentBeforeContemplation).toBe(0);
    expect(result.monthlyInsurance).toBe(0);
  });

  // ─── Modelo OPERACIONAL CAIXA (Onda OP) ───
  // baseInput: imobiliário → rate vigente da modalidade imobiliária 0,000433.
  // Categoria Inicial = credit + adm + FR = 300_000 + 48_000 + 9_000 = 357_000
  // monthlyInsurance = 357_000 × 0,000433 = 154,581
  // insuranceTotal   = 154,581 × 180 = 27.824,58
  // totalCost        = 357_000 + 27.824,58 = 384.824,58
  // installment      = 384.824,58 / 180 ≈ 2.137,91
  const CATEGORY = 357_000;
  const MONTHLY_INS = 154.581;
  const INS_TOTAL = MONTHLY_INS * 180; // 27824.58
  const TOTAL_COST = CATEGORY + INS_TOTAL; // 384824.58
  const INSTALLMENT = TOTAL_COST / 180; // 2137.91

  it("calculates fixed monthly insurance correctly (CAIXA operational model)", () => {
    const result = calculateSimulation(baseInput);
    expect(result.monthlyInsurance).toBeCloseTo(MONTHLY_INS, 2);
    expect(result.insuranceTotal).toBeCloseTo(INS_TOTAL, 2);
  });

  it("calculates total cost correctly", () => {
    const result = calculateSimulation(baseInput);
    expect(result.adminFee).toBeCloseTo(48000, 2);
    expect(result.reserveFund).toBeCloseTo(9000, 2);
    expect(result.totalCost).toBeCloseTo(TOTAL_COST, 2);
  });

  it("calculates installment correctly", () => {
    const result = calculateSimulation(baseInput);
    expect(result.installmentBeforeContemplation).toBeCloseTo(INSTALLMENT, 0);
    expect(result.installmentAfterContemplation).toBeCloseTo(INSTALLMENT, 0);
  });

  it("contemplation reduces installment with bids", () => {
    const input: SimulationInput = {
      ...baseInput,
      freeBidValue: 50000,
      embeddedBidValue: 30000,
    };
    const result = calculateSimulation(input, true, "reduce-installment", 12);
    const amountPaid = INSTALLMENT * 12;
    const remainingDebt = TOTAL_COST - amountPaid - 80000;
    const expected = remainingDebt / (180 - 12);
    expect(result.installmentAfterContemplation).toBeCloseTo(expected, 0);
    expect(result.remainingTermAfterContemplation).toBe(168);
    expect(result.netCreditValue).toBe(270000);
  });

  it("contemplation with reduce-term keeps installment", () => {
    const input: SimulationInput = {
      ...baseInput,
      freeBidValue: 50000,
    };
    const result = calculateSimulation(input, true, "reduce-term", 12);
    expect(result.installmentAfterContemplation).toBeCloseTo(INSTALLMENT, 0);
    expect(result.remainingTermAfterContemplation).toBeLessThan(168);
  });

  it("auto/pesados — premium operacional sobre categoria inicial", () => {
    const autoInput: SimulationInput = {
      ...baseInput,
      consortiumType: "auto",
      insurancePercent: 0.09, // toggle on; valor ignorado pela engine operacional
      proponentAge: 45,
      termMonths: 80,
    };
    const result = calculateSimulation(autoInput);
    // categoria = 300_000 + 48_000 + 9_000 = 357_000
    // monthly = 357_000 × 0.000765 = 273.105
    expect(result.monthlyInsurance).toBeCloseTo(273.105, 2);
    expect(result.insuranceTotal).toBeCloseTo(273.105 * 80, 2);
  });

  it("reduced installment calculates 70% of base", () => {
    const input: SimulationInput = { ...baseInput, reducedInstallment: true };
    const result = calculateSimulation(input);
    const baseInstallment = TOTAL_COST / 180;
    expect(result.installmentBeforeContemplation).toBeCloseTo(baseInstallment * 0.7, 0);
  });
  // ═══════ CENÁRIO: NÃO CONTEMPLADO ═══════

  describe("scenario: none (not contemplated)", () => {
    it("normal installment — contemplationType is 'none'", () => {
      const result = calculateSimulation(baseInput);
      expect(result.contemplationType).toBe('none');
      expect(result.fullInstallment).toBeCloseTo(INSTALLMENT, 0);
      expect(result.installmentBeforeContemplation).toBeCloseTo(result.fullInstallment, 2);
    });

    it("reduced installment — rediluted value is consistent", () => {
      const input = { ...baseInput, reducedInstallment: true };
      const result = calculateSimulation(input);
      const full = result.fullInstallment;
      const reduced = result.reducedInstallmentValue;
      const rediluted = result.redilutedInstallmentValue;

      expect(reduced).toBeCloseTo(full * 0.7, 2);
      // Conservation: reduced*80 + rediluted*100 = totalCost
      const totalFromParts = reduced * 80 + rediluted * (180 - 80);
      expect(totalFromParts).toBeCloseTo(result.totalCost, 0);
    });
  });

  // ═══════ CENÁRIO: SORTEIO ═══════

  describe("scenario: sorteio (lottery)", () => {
    it("contemplationType is 'sorteio' when no bids", () => {
      const result = calculateSimulation(baseInput, true, 'keep-reduced-credit-adjusted', 12);
      expect(result.contemplationType).toBe('sorteio');
    });

    it("keep-reduced-credit-adjusted — credit is reduced, installment stays reduced", () => {
      const input = { ...baseInput, reducedInstallment: true };
      const result = calculateSimulation(input, true, 'keep-reduced-credit-adjusted', 12);
      expect(result.installmentAfterContemplation).toBeCloseTo(result.reducedInstallmentValue, 2);
      expect(result.adjustedCreditValue).toBeLessThan(input.creditValue);
    });

    it("restore-installment-keep-credit — credit maintained", () => {
      const input = { ...baseInput, reducedInstallment: true };
      const result = calculateSimulation(input, true, 'restore-installment-keep-credit', 12);
      expect(result.adjustedCreditValue).toBe(result.netCreditValue);
      expect(result.installmentAfterContemplation).toBeGreaterThan(result.reducedInstallmentValue);
    });

    it("without reduced installment — installment equals remaining debt / remaining term", () => {
      const result = calculateSimulation(baseInput, true, 'restore-installment-keep-credit', 24);
      const full = result.fullInstallment;
      const amountPaid = full * 24;
      const remainingDebt = result.totalCost - amountPaid;
      const remainingTerm = 180 - 24;
      expect(result.installmentAfterContemplation).toBeCloseTo(remainingDebt / remainingTerm, 0);
    });
  });

  // ═══════ CENÁRIO: LANCE ═══════

  describe("scenario: lance (bid)", () => {
    it("contemplationType is 'lance' when bids > 0", () => {
      const input = { ...baseInput, freeBidValue: 50000 };
      const result = calculateSimulation(input, true, 'reduce-installment', 12);
      expect(result.contemplationType).toBe('lance');
    });

    it("free bid — credit maintained, debt reduced", () => {
      const input = { ...baseInput, freeBidValue: 50000 };
      const result = calculateSimulation(input, true, 'reduce-installment', 12);
      expect(result.netCreditValue).toBe(300000); // no embedded bid
      const full = result.fullInstallment;
      const amountPaid = full * 12;
      const expectedDebt = result.totalCost - amountPaid - 50000;
      expect(result.debtAfterContemplation).toBeCloseTo(expectedDebt, 0);
    });

    it("embedded bid — credit reduced via netCreditValue", () => {
      const input = { ...baseInput, embeddedBidValue: 30000 };
      const result = calculateSimulation(input, true, 'reduce-installment', 12);
      expect(result.netCreditValue).toBe(270000);
      expect(result.contemplationType).toBe('lance');
    });

    it("reduce-installment — term stays, installment drops", () => {
      const input = { ...baseInput, freeBidValue: 50000 };
      const result = calculateSimulation(input, true, 'reduce-installment', 12);
      expect(result.remainingTermAfterContemplation).toBe(168);
      expect(result.installmentAfterContemplation).toBeLessThan(result.fullInstallment);
    });

    it("reduce-term — installment stays, term drops", () => {
      const input = { ...baseInput, freeBidValue: 50000 };
      const result = calculateSimulation(input, true, 'reduce-term', 12);
      expect(result.installmentAfterContemplation).toBeCloseTo(result.fullInstallment, 2);
      expect(result.remainingTermAfterContemplation).toBeLessThan(168);
    });
  });

  // ═══════ EDGE CASES ═══════

  describe("edge cases", () => {
    it("monthsElapsed >= termMonths — no division by zero", () => {
      const result = calculateSimulation(baseInput, true, 'reduce-installment', 180);
      // monthsElapsed is clamped to termMonths-1, so remainingTerm >= 1
      expect(result.remainingTermAfterContemplation).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.installmentAfterContemplation)).toBe(true);
    });

    it("bid igual ao crédito — saldo principal zerado (pós A1 clamp)", () => {
      // A1: freeBidValue é clampado a creditValue. Lance = crédito cobre
      // exatamente o principal; adm+FR remanescentes são amortizados pelas
      // parcelas restantes. debtAfterContemplation cai bem abaixo do crédito.
      const input = { ...baseInput, freeBidValue: baseInput.creditValue };
      const result = calculateSimulation(input, true, 'reduce-installment', 12);
      expect(result.debtAfterContemplation).toBeGreaterThanOrEqual(0);
      expect(result.debtAfterContemplation).toBeLessThan(baseInput.creditValue);
    });
  });
});

describe("calculateFinancingCost", () => {
  it("guard clause: termMonths=0 returns zeroed result", () => {
    const result = calculateFinancingCost(300000, 0, 12);
    expect(result.priceMonthlyPayment).toBe(0);
    expect(result.sacTotalCost).toBe(0);
    expect(result.priceTable).toHaveLength(0);
  });

  it("calculates Price table correctly", () => {
    const result = calculateFinancingCost(300000, 360, 12);
    // Monthly payment should be around 2945 for 12% a.a. / 360 months (compound equivalence)
    expect(result.priceMonthlyPayment).toBeGreaterThan(2900);
    expect(result.priceMonthlyPayment).toBeLessThan(3000);
    expect(result.priceTable).toHaveLength(360);
    // Total cost > credit value
    expect(result.priceTotalCost).toBeGreaterThan(300000);
  });

  it("calculates SAC table correctly", () => {
    const result = calculateFinancingCost(300000, 360, 12);
    // SAC: first payment > last payment (decreasing)
    expect(result.sacFirstPayment).toBeGreaterThan(result.sacLastPayment);
    expect(result.sacTable).toHaveLength(360);
    // SAC total cost < Price total cost
    expect(result.sacTotalWithInsurance).toBeLessThan(result.priceTotalWithInsurance);
  });

  it("accepts custom MIP, DFI, and admin fee", () => {
    const defaultResult = calculateFinancingCost(300000, 360, 12);
    const customResult = calculateFinancingCost(300000, 360, 12, 0.05, 0.05, 50);
    // Higher MIP/DFI/admin should increase total cost
    expect(customResult.priceTotalWithInsurance).toBeGreaterThan(defaultResult.priceTotalWithInsurance);
    expect(customResult.sacTotalWithInsurance).toBeGreaterThan(defaultResult.sacTotalWithInsurance);
  });

  it("zero interest rate works (Price = simple division)", () => {
    const result = calculateFinancingCost(300000, 180, 0);
    expect(result.priceMonthlyPayment).toBeCloseTo(300000 / 180, 2);
  });
});

describe("getMIPRateByAge — shim canônico (Onda 2 Prestamista)", () => {
  it("retorna SEMPRE o percentual canônico (0,0765%) — idade NÃO afeta o prêmio", () => {
    // Pós-Onda 2: a tabela por idade foi revogada. O shim retorna o
    // percentual fixo oficial CAIXA (cota nova) para QUALQUER idade.
    const expected = 0.0765;
    expect(getMIPRateByAge(18)).toBeCloseTo(expected, 6);
    expect(getMIPRateByAge(35)).toBeCloseTo(expected, 6);
    expect(getMIPRateByAge(60)).toBeCloseTo(expected, 6);
    expect(getMIPRateByAge(80)).toBeCloseTo(expected, 6);
  });

  it("ignora idades fora da faixa (mantido por compat — sem clamp obrigatório)", () => {
    const expected = 0.0765;
    expect(getMIPRateByAge(10)).toBeCloseTo(expected, 6);
    expect(getMIPRateByAge(90)).toBeCloseTo(expected, 6);
  });

  // (Onda 2B) `getMIPAgeRangeLabel` foi REMOVIDO — labels passaram a ser
  // strings estáticas "sobre saldo devedor" inline na UI/PDF.

  it("validates proponent age (18 ≤ idade ≤ 80)", () => {
    expect(isValidProponentAge(18)).toBe(true);
    expect(isValidProponentAge(80)).toBe(true);
    expect(isValidProponentAge(17)).toBe(false);
    expect(isValidProponentAge(81)).toBe(false);
  });
});

describe("calculateSimulation — edge case protections", () => {
  const baseInput: SimulationInput = {
    creditValue: 300000,
    termMonths: 180,
    consortiumType: "imobiliario",
    adminFeePercent: 16,
    reserveFundPercent: 3,
    insurancePercent: 0.05,
    proponentAge: 30,
    reducedInstallment: false,
    freeBidValue: 0,
    embeddedBidValue: 0,
  };

  it("negative creditValue returns zero-based results", () => {
    const result = calculateSimulation({ ...baseInput, creditValue: -100000 });
    expect(result.totalCost).toBe(0);
    expect(result.fullInstallment).toBe(0);
    expect(result.netCreditValue).toBe(0);
    expect(result.installmentBeforeContemplation).toBeGreaterThanOrEqual(0);
  });

  it("embeddedBid > creditValue is capped to creditValue", () => {
    const result = calculateSimulation({ ...baseInput, embeddedBidValue: 500000 });
    expect(result.netCreditValue).toBe(0);
    expect(result.netCreditValue).toBeGreaterThanOrEqual(0);
  });

  it("negative termMonths returns zeroed result", () => {
    const result = calculateSimulation({ ...baseInput, termMonths: -10 });
    expect(result.totalCost).toBe(0);
    expect(result.fullInstallment).toBe(0);
  });

  it("monthsElapsed >= termMonths does not produce NaN or Infinity", () => {
    const result = calculateSimulation(baseInput, true, 'reduce-installment', 999);
    expect(isFinite(result.installmentAfterContemplation)).toBe(true);
    expect(isNaN(result.installmentAfterContemplation)).toBe(false);
    expect(result.remainingTermAfterContemplation).toBeGreaterThanOrEqual(0);
  });

  it("monthsElapsed = termMonths - 1 (boundary) works correctly", () => {
    const result = calculateSimulation(baseInput, true, 'reduce-installment', 179);
    expect(isFinite(result.installmentAfterContemplation)).toBe(true);
    expect(result.remainingTermAfterContemplation).toBeGreaterThanOrEqual(0);
  });

  it("lance clampado ao crédito não gera saldo negativo (pós A1)", () => {
    // A1: freeBidValue > creditValue é clampado. Validamos que o motor
    // não produz valores negativos e que debtAfterContemplation ≥ 0.
    const result = calculateSimulation(
      { ...baseInput, freeBidValue: baseInput.creditValue, embeddedBidValue: 0 },
      true, 'reduce-installment', 12
    );
    expect(result.debtAfterContemplation).toBeGreaterThanOrEqual(0);
    expect(result.installmentAfterContemplation).toBeGreaterThanOrEqual(0);
  });

  it("no result field is NaN or Infinity for normal input", () => {
    const result = calculateSimulation(baseInput);
    for (const [key, val] of Object.entries(result)) {
      if (typeof val === 'number') {
        expect(isNaN(val)).toBe(false);
        expect(isFinite(val)).toBe(true);
      }
    }
  });

  it("no result field is negative for normal input", () => {
    const result = calculateSimulation(baseInput, true, 'reduce-installment', 12);
    for (const [key, val] of Object.entries(result)) {
      if (typeof val === 'number') {
        expect(val).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("zero creditValue returns all-zero financial values", () => {
    const result = calculateSimulation({ ...baseInput, creditValue: 0 });
    expect(result.fullInstallment).toBe(0);
    expect(result.adminFee).toBe(0);
    expect(result.reserveFund).toBe(0);
  });

  it("sorteio with monthsElapsed=0 works correctly", () => {
    const result = calculateSimulation(baseInput, true, 'reduce-installment', 0);
    expect(isFinite(result.installmentAfterContemplation)).toBe(true);
    expect(result.debtAfterContemplation).toBeGreaterThanOrEqual(0);
  });
});
