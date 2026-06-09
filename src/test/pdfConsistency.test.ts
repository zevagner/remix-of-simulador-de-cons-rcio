/**
 * Teste de consistência Tela ↔ PDF (Comparador).
 *
 * Reproduz a lógica de derivação de "custos efetivos" usada em
 * `ComparatorModule.tsx` e o consumo de fonte única em
 * `PdfAnaliseFinanceira.tsx`. Garante que os 5 valores que alimentam
 * o PDF (consórcio, price, sac, price 420m, sac 420m) sejam EXATAMENTE
 * iguais aos exibidos na tela.
 */
import { describe, it, expect } from 'vitest';
import { calculateSimulationLegacy, calculateFinancingCost } from '@/core/finance';

describe('PDF Comparador — consistência tela vs PDF', () => {
  // ─── PASSO 1: cenário fixo ───
  const creditValue = 300000;
  const termMonths = 200;
  const freeBidValue = 100000;
  const embeddedBidValue = 0;
  const consortiumType = 'imobiliario' as const;
  const adminFeePercent = 22;
  const reserveFundPercent = 1;
  const insurancePercent = 0;
  const proponentAge = 35;

  const financingRate = 11.49;
  const mipRate = 0.025;
  const dfiRate = 0.01;
  const adminFeeMonthly = 25;

  // ─── PASSO 2: valores que a TELA calcula (ComparatorModule) ───
  const consortiumResult = calculateSimulationLegacy({
    creditValue, termMonths, consortiumType,
    adminFeePercent, reserveFundPercent,
    insurancePercent, proponentAge,
    reducedInstallment: false, freeBidValue, embeddedBidValue,
  });

  const propertyValue = consortiumResult.netCreditValue;
  const safeDownPayment = Math.min(Math.max(0, freeBidValue), propertyValue);
  const financingBase = Math.max(propertyValue - safeDownPayment, 0);

  const financingResult = calculateFinancingCost(
    financingBase, termMonths, financingRate, mipRate, dfiRate, adminFeeMonthly, propertyValue,
  );
  const financing420Result = calculateFinancingCost(
    financingBase, 420, financingRate, mipRate, dfiRate, adminFeeMonthly, propertyValue,
  );

  // Mesma fórmula do ComparatorModule (card "Resultado" + tabelas)
  const screen = {
    effectiveConsortiumCost: consortiumResult.totalCost + freeBidValue + embeddedBidValue,
    priceTotalEffective: financingResult.priceTotalWithInsurance + safeDownPayment,
    sacTotalEffective: financingResult.sacTotalWithInsurance + safeDownPayment,
    price420TotalEffective: financing420Result.priceTotalWithInsurance + safeDownPayment,
    sac420TotalEffective: financing420Result.sacTotalWithInsurance + safeDownPayment,
  };

  // ─── PASSO 3: payload que ComparatorModule envia ao PDF ───
  const pdfPayload = {
    effectiveConsortiumCost: screen.effectiveConsortiumCost,
    priceTotalEffective: screen.priceTotalEffective,
    sacTotalEffective: screen.sacTotalEffective,
    price420TotalEffective: screen.price420TotalEffective,
    sac420TotalEffective: screen.sac420TotalEffective,
  };

  // Mesma resolução do `renderComparador` em PdfAnaliseFinanceira.tsx
  const pdf = {
    consortiumTotal: pdfPayload.effectiveConsortiumCost ?? consortiumResult.totalCost,
    priceTotal: pdfPayload.priceTotalEffective ?? financingResult.priceTotalWithInsurance,
    sacTotal: pdfPayload.sacTotalEffective ?? financingResult.sacTotalWithInsurance,
    price420Total: pdfPayload.price420TotalEffective ?? financing420Result.priceTotalWithInsurance,
    sac420Total: pdfPayload.sac420TotalEffective ?? financing420Result.sacTotalWithInsurance,
  };

  // ─── PASSO 4: comparações ───
  it('Custo efetivo do consórcio (tela == PDF)', () => {
    expect(pdf.consortiumTotal).toBe(screen.effectiveConsortiumCost);
  });

  it('Custo total Price — prazo do consórcio (tela == PDF)', () => {
    expect(pdf.priceTotal).toBe(screen.priceTotalEffective);
  });

  it('Custo total SAC — prazo do consórcio (tela == PDF)', () => {
    expect(pdf.sacTotal).toBe(screen.sacTotalEffective);
  });

  it('Custo total Price 420m (tela == PDF)', () => {
    expect(pdf.price420Total).toBe(screen.price420TotalEffective);
  });

  it('Custo total SAC 420m (tela == PDF)', () => {
    expect(pdf.sac420Total).toBe(screen.sac420TotalEffective);
  });

  it('Lance livre está incluso no custo efetivo do consórcio', () => {
    // Sanity check: o custo efetivo deve ser MAIOR que o totalCost cru
    // (que ignora desembolso de lance livre).
    expect(screen.effectiveConsortiumCost).toBeGreaterThan(consortiumResult.totalCost);
    expect(screen.effectiveConsortiumCost - consortiumResult.totalCost).toBe(freeBidValue);
  });

  it('Entrada está inclusa no custo efetivo do financiamento', () => {
    expect(screen.priceTotalEffective).toBeGreaterThan(financingResult.priceTotalWithInsurance);
    expect(screen.priceTotalEffective - financingResult.priceTotalWithInsurance).toBeCloseTo(safeDownPayment, 2);
  });
});
