/**
 * Paridade Tela ↔ PDF — Simulador.
 *
 * Garante que os valores renderizados no PDF do Simulador são EXATAMENTE
 * os mesmos do `monthlySchedule` (fonte única de verdade financeira):
 *  - Parcela Inicial = monthlySchedule.rows[0].payment
 *  - Custo Total do Plano = monthlySchedule.costWithInsurance
 *
 * Se este teste quebrar, alguém reintroduziu cálculo/fallback no PDF.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { calculateMonthlySchedule, getEffectiveClientCost } from '@/core/finance';
import { formatCurrency } from '@/utils/format';
import {
  PdfSimulador,
  type PdfSimuladorCompositionRow,
  type PdfSimuladorSummaryItem,
} from '@/components/pdf/PdfSimulador';
import type { SimulationInput, SimulationResult, ConsortiumType } from '@/types/consortium';

const TYPE_LABELS: Record<ConsortiumType, string> = {
  imobiliario: 'Imobiliário',
  auto: 'Automóvel',
  pesados: 'Pesados',
};

function buildPdfData(scenario: {
  creditValue: number;
  termMonths: number;
  consortiumType: ConsortiumType;
  adminFeePercent: number;
  reserveFundPercent: number;
  proponentAge: number;
  insurancePercent: number;
  freeBidValue?: number;
  embeddedBidValue?: number;
}) {
  const input: SimulationInput = {
    creditValue: scenario.creditValue,
    termMonths: scenario.termMonths,
    consortiumType: scenario.consortiumType,
    adminFeePercent: scenario.adminFeePercent,
    reserveFundPercent: scenario.reserveFundPercent,
    insurancePercent: scenario.insurancePercent,
    proponentAge: scenario.proponentAge,
    reducedInstallment: false,
    freeBidValue: scenario.freeBidValue ?? 0,
    embeddedBidValue: scenario.embeddedBidValue ?? 0,
  };

  const monthlySchedule = calculateMonthlySchedule({
    sim: input,
    contemplated: false,
    contemplationType: 'none',
    contemplationMonth: 0,
    postLanceChoice: 'reduce-installment',
    annualAdjustmentPercent: 0,
  });

  // Mock mínimo do SimulationResult (PDF só usa campos auxiliares dele).
  const result: SimulationResult = {
    fullInstallment: monthlySchedule.rows[0].payment,
    reducedInstallmentValue: 0,
    redilutedInstallmentValue: 0,
    reducedInstallmentMonths: 0,
    monthlyInsurance: monthlySchedule.totalInsurance / input.termMonths,
    insuranceTotal: monthlySchedule.totalInsurance,
    adminFee: monthlySchedule.rows.reduce((s, r) => s + r.amortAdminFee, 0),
    reserveFund: monthlySchedule.rows.reduce((s, r) => s + r.amortReserveFund, 0),
    totalCost: monthlySchedule.costWithInsurance,
    netCreditValue: input.creditValue - input.embeddedBidValue,
    debtAfterContemplation: 0,
    remainingTermAfterContemplation: 0,
    installmentAfterContemplation: monthlySchedule.rows[0].payment,
    adjustedCreditValue: input.creditValue,
  } as SimulationResult;

  const firstRow = monthlySchedule.rows[0];
  const composition: PdfSimuladorCompositionRow[] = [
    { name: 'Fundo Comum', monthlyLabel: formatCurrency(firstRow.amortCredit), totalLabel: formatCurrency(0), percentLabel: '0%' },
  ];
  const summaryItems: PdfSimuladorSummaryItem[] = [
    { label: 'Parcela Inicial', value: formatCurrency(firstRow.payment) },
  ];

  return {
    monthlySchedule,
    pdfProps: {
      input,
      result,
      monthlySchedule,
      initialInstallmentLabel: formatCurrency(firstRow.payment),
      totalCostLabel: formatCurrency(monthlySchedule.costWithInsurance),
      totalBidOfferedLabel: formatCurrency((input.freeBidValue || 0) + (input.embeddedBidValue || 0)),
      effectiveClientCostLabel: formatCurrency(getEffectiveClientCost(monthlySchedule)),
      composition,
      summaryItems,
      effectiveAdminFeePercent: scenario.adminFeePercent,
      mipRate: scenario.insurancePercent,
      insuranceEnabled: scenario.insurancePercent > 0,
      actualFreeBidValue: input.freeBidValue,
      actualEmbeddedBidValue: input.embeddedBidValue,
      contemplated: false,
      contemplationMonth: 0,
      typeLabels: TYPE_LABELS,
      maxReducedMonths: 0,
    },
  };
}

describe('PdfSimulador — paridade tela ↔ PDF (monthlySchedule é fonte única)', () => {
  const scenarios = [
    {
      name: 'Imobiliário 450k / 200m',
      creditValue: 450_000, termMonths: 200, consortiumType: 'imobiliario' as const,
      adminFeePercent: 17.42, reserveFundPercent: 2.5, proponentAge: 35, insurancePercent: 0.0234,
    },
    {
      name: 'Auto 80k / 80m com lance livre',
      creditValue: 80_000, termMonths: 80, consortiumType: 'auto' as const,
      adminFeePercent: 19, reserveFundPercent: 1, proponentAge: 40, insurancePercent: 0.04,
      freeBidValue: 10_000,
    },
  ];

  for (const sc of scenarios) {
    it(`renderiza parcela inicial e custo total do schedule (${sc.name})`, () => {
      const { monthlySchedule, pdfProps } = buildPdfData(sc);

      const expectedFirstPayment = formatCurrency(monthlySchedule.rows[0].payment);
      const expectedTotalCost = formatCurrency(monthlySchedule.costWithInsurance);

      const { container } = render(<PdfSimulador data={pdfProps} />);
      const html = container.textContent || '';

      // Parcela Inicial — exato valor do schedule.
      expect(html).toContain(expectedFirstPayment);
      // Custo Total do Plano — exato valor do schedule.
      expect(html).toContain(expectedTotalCost);

      // Sanidade: valores não são zero.
      expect(monthlySchedule.rows[0].payment).toBeGreaterThan(0);
      expect(monthlySchedule.costWithInsurance).toBeGreaterThan(0);
    });
  }

  it('exibe bloco de erro quando monthlySchedule está ausente (sem fallback)', () => {
    const { pdfProps } = buildPdfData(scenarios[0]);
    const { container } = render(
      <PdfSimulador data={{ ...pdfProps, monthlySchedule: undefined as any }} />
    );
    expect(container.textContent).toMatch(/cronograma mensal.*ausente/i);
  });
});
