/**
 * Audit de relevância de KPIs — Operações Estruturadas.
 *
 * Garante que KPIs de lance/parcela pós-contemplação só aparecem quando
 * realmente carregam informação consultiva (caso contrário, são ruído visual).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StructuredOpsConsolidated } from '@/components/modules/structured-ops/StructuredOpsConsolidated';
import type { ConsolidatedResult } from '@/components/modules/structured-ops/structuredOpsTypes';

const baseConsolidated: ConsolidatedResult = {
  totalCreditValue: 500_000,
  totalInitialInstallment: 3_500,
  totalInstallmentAfterContemplation: 3_500, // sem lance => idêntica
  totalPaid: 700_000,
  totalCost: 200_000,
  freeBidValue: 0,
  embeddedBidValue: 0,
  totalBid: 0,
  availableCredit: 500_000,
  totalQuantity: 2,
  adminFeeTotal: 90_000,
  reserveFundTotal: 10_000,
  insuranceTotal: 0,
};

describe('StructuredOpsConsolidated — KPI relevance', () => {
  it('NÃO renderiza "Lance Total" quando totalBid = 0', () => {
    const { queryByText } = render(<StructuredOpsConsolidated consolidated={baseConsolidated} effectiveRate={20} />);
    expect(queryByText('Lance Total')).toBeNull();
  });

  it('NÃO renderiza bloco de composição de lance quando não há lance', () => {
    const { queryByText } = render(<StructuredOpsConsolidated consolidated={baseConsolidated} effectiveRate={20} />);
    expect(queryByText('Lance Recursos Próprios')).toBeNull();
    expect(queryByText('Lance Embutido')).toBeNull();
    expect(queryByText('Crédito Disponível')).toBeNull();
    expect(queryByText('Valor Emprestado')).toBeNull();
  });

  it('NÃO renderiza "Parcela Pós Contemplação" quando é idêntica à inicial', () => {
    const { queryByText } = render(<StructuredOpsConsolidated consolidated={baseConsolidated} effectiveRate={20} />);
    expect(queryByText('Parcela Pós Contemplação')).toBeNull();
  });

  it('renderiza "Lance Total" e bloco de composição quando há lance', () => {
    const withBid: ConsolidatedResult = {
      ...baseConsolidated,
      freeBidValue: 50_000,
      embeddedBidValue: 25_000,
      totalBid: 75_000,
      availableCredit: 475_000,
      totalInstallmentAfterContemplation: 2_900,
    };
    const { getByText } = render(<StructuredOpsConsolidated consolidated={withBid} effectiveRate={20} />);
    expect(getByText('Lance Total')).toBeInTheDocument();
    expect(getByText('Lance Recursos Próprios')).toBeInTheDocument();
    expect(getByText('Lance Embutido')).toBeInTheDocument();
    expect(getByText('Crédito Disponível')).toBeInTheDocument();
    expect(getByText('Valor Emprestado')).toBeInTheDocument();
    expect(getByText('Parcela Pós Contemplação')).toBeInTheDocument();
  });

  it('omite "Crédito Disponível" quando só há lance de recursos próprios (sem embutido)', () => {
    const onlyFree: ConsolidatedResult = {
      ...baseConsolidated,
      freeBidValue: 50_000,
      embeddedBidValue: 0,
      totalBid: 50_000,
      availableCredit: 500_000,
      totalInstallmentAfterContemplation: 3_100,
    };
    const { queryByText, getByText } = render(<StructuredOpsConsolidated consolidated={onlyFree} effectiveRate={20} />);
    expect(getByText('Lance Recursos Próprios')).toBeInTheDocument();
    expect(queryByText('Lance Embutido')).toBeNull();
    expect(queryByText('Crédito Disponível')).toBeNull(); // = total das cartas, redundante
    expect(getByText('Valor Emprestado')).toBeInTheDocument();
  });

  it('omite "Lance Recursos Próprios" quando só há lance embutido', () => {
    const onlyEmbedded: ConsolidatedResult = {
      ...baseConsolidated,
      freeBidValue: 0,
      embeddedBidValue: 100_000,
      totalBid: 100_000,
      availableCredit: 400_000,
      totalInstallmentAfterContemplation: 2_800,
    };
    const { queryByText, getByText } = render(<StructuredOpsConsolidated consolidated={onlyEmbedded} effectiveRate={20} />);
    expect(queryByText('Lance Recursos Próprios')).toBeNull();
    expect(getByText('Lance Embutido')).toBeInTheDocument();
    expect(getByText('Crédito Disponível')).toBeInTheDocument();
  });

  it('mantém bloco de custos sempre visível (sempre relevante)', () => {
    const { getByText } = render(<StructuredOpsConsolidated consolidated={baseConsolidated} effectiveRate={20} />);
    expect(getByText('Custo das Taxas')).toBeInTheDocument();
    expect(getByText('Taxa Total')).toBeInTheDocument();
    expect(getByText('Qtde. Total de Cotas')).toBeInTheDocument();
  });
});
