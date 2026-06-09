/**
 * Audit de coerência consultiva — Comparador Financeiro.
 *
 * Garante que KPIs/mensagens só aparecem quando carregam significado real:
 *  - "X é Y mais barato" só com diferença ≥ R$ 1,00 (caso contrário: "Custo equivalente")
 *  - "Diferença vs PRICE/SAC" só quando há base financiada (entrada não cobre 100%)
 *  - "Comparativo 420 meses" só quando termMonths !== 420 (e há financiamento real)
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ConsortiumComparisonTab } from '@/components/modules/comparator/ConsortiumComparisonTab';
import { FinancingComparisonTab } from '@/components/modules/comparator/FinancingComparisonTab';
import type { SimulationResult } from '@/types/consortium';

// Recharts ResponsiveContainer precisa de um width/height fixo no jsdom para renderizar.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 400 }}>{children}</div>
    ),
  };
});

const baseConsortium: SimulationResult = {
  fullInstallment: 3_000,
  reducedInstallment: 0,
  redilutedInstallment: 0,
  installmentAfterContemplation: 3_000,
  totalCost: 600_000,
  totalAdminFee: 80_000,
  totalReserveFund: 10_000,
  totalInsurance: 0,
  netCreditValue: 500_000,
  // campos adicionais não usados pelos componentes nesses testes
} as unknown as SimulationResult;

const baseFinancing = {
  priceMonthlyPayment: 4_000,
  priceTotalCost: 800_000,
  priceTotalWithInsurance: 820_000,
  priceTotalMIP: 10_000,
  priceTotalDFI: 10_000,
  sacFirstPayment: 4_500,
  sacLastPayment: 2_500,
  sacTotalCost: 750_000,
  sacTotalWithInsurance: 770_000,
  sacTotalMIP: 10_000,
  sacTotalDFI: 10_000,
  sacTable: [],
  priceTable: [],
};

const noop = () => {};
const getDomain = (vals: number[]): [number, number] => [0, Math.max(...vals.filter(v => v > 0), 1) * 1.1];

describe('ConsortiumComparisonTab — coerência da mensagem de veredito', () => {
  function renderWith(opt2Total: number) {
    const c2: SimulationResult = { ...baseConsortium, totalCost: opt2Total };
    return render(
      <ConsortiumComparisonTab
        consortiumResult={baseConsortium}
        consortium2Result={c2}
        creditValue={500_000}
        termMonths={120}
        adminFee={20}
        reserveFund={2}
        adminFee2={20}
        setAdminFee2={noop}
        reserveFund2={2}
        setReserveFund2={noop}
        insuranceEnabled={false}
        useAdjustedScale={false}
        setUseAdjustedScale={noop}
        getAdjustedDomain={getDomain}
        applyConsortiumAdjustment={false}
        setApplyConsortiumAdjustment={noop}
        consortiumAdjustmentPercent={4}
        setConsortiumAdjustmentPercent={noop}
      />
    );
  }

  it('mostra "Custo equivalente" quando totais empatam (diff < R$ 1,00)', () => {
    const { getByText, queryByText } = renderWith(baseConsortium.totalCost);
    expect(getByText('Custo equivalente entre os dois cenários')).toBeInTheDocument();
    expect(queryByText(/mais barato/)).toBeNull();
  });

  it('Consórcio 1 mais barato quando totalCost menor', () => {
    const { getByText } = renderWith(baseConsortium.totalCost + 50_000);
    expect(getByText(/Consórcio 1 é/)).toBeInTheDocument();
    expect(getByText(/mais barato/)).toBeInTheDocument();
  });

  it('Consórcio 2 mais barato quando totalCost menor', () => {
    const { getByText } = renderWith(baseConsortium.totalCost - 50_000);
    expect(getByText(/Consórcio 2 é/)).toBeInTheDocument();
  });

  it('NÃO mostra "R$ 0,00 mais barato" em nenhuma situação de empate', () => {
    const { queryByText } = renderWith(baseConsortium.totalCost + 0.5); // diff < R$ 1
    expect(queryByText(/R\$\s*0,00 mais barato/)).toBeNull();
  });
});

describe('FinancingComparisonTab — KPIs condicionais à existência de financiamento', () => {
  function renderWith(overrides: { financingBase: number; termMonths?: number }) {
    return render(
      <FinancingComparisonTab
        consortiumResult={baseConsortium}
        financingResult={baseFinancing}
        financing420Result={baseFinancing}
        creditValue={500_000}
        financingBase={overrides.financingBase}
        propertyValue={500_000}
        hasEmbeddedBid={false}
        freeBidValue={overrides.financingBase === 0 ? 500_000 : 0}
        embeddedBidValue={0}
        downPayment={overrides.financingBase === 0 ? 500_000 : 0}
        useBidAsDownPayment={true}
        setUseBidAsDownPayment={noop}
        manualDownPayment={0}
        setManualDownPayment={noop}
        termMonths={overrides.termMonths ?? 120}
        adminFee={20}
        reserveFund={2}
        financingRate={11.5}
        setFinancingRate={noop}
        mipRate={0.025}
        setMipRate={noop}
        dfiRate={0.0035}
        setDfiRate={noop}
        adminFeeMonthly={25}
        setAdminFeeMonthly={noop}
        priceSavings={100_000}
        priceSavingsPercent={12.5}
        sacSavings={80_000}
        sacSavingsPercent={10}
        insuranceEnabled={false}
        custoDesembolsado={600_000}
        creditoLiquido={500_000}
        custoEfetivoReal={1.2}
        applyTR={false}
        setApplyTR={noop}
        trMonthlyRate={0.1}
        setTrMonthlyRate={noop}
      />
    );
  }

  it('mostra "Diferença vs PRICE/SAC" quando há financiamento real (financingBase > 0)', () => {
    const { getByText } = renderWith({ financingBase: 400_000 });
    expect(getByText('Diferença estimada vs PRICE')).toBeInTheDocument();
    expect(getByText('Diferença estimada vs SAC')).toBeInTheDocument();
  });

  it('NÃO mostra diferença vs PRICE/SAC quando entrada cobre 100% (financingBase = 0)', () => {
    const { queryByText, getByText } = renderWith({ financingBase: 0 });
    expect(queryByText('Diferença estimada vs PRICE')).toBeNull();
    expect(queryByText('Diferença estimada vs SAC')).toBeNull();
    expect(getByText(/A entrada cobre 100% do valor do bem/)).toBeInTheDocument();
  });

  it('mostra bloco "420 meses" quando termMonths !== 420 e há financiamento', () => {
    const { getByText } = renderWith({ financingBase: 400_000, termMonths: 120 });
    expect(getByText(/Comparativo com Prazo de 420 Meses/)).toBeInTheDocument();
  });

  it('OCULTA bloco "420 meses" quando termMonths === 420 (seria duplicado)', () => {
    const { queryByText } = renderWith({ financingBase: 400_000, termMonths: 420 });
    expect(queryByText(/Comparativo com Prazo de 420 Meses/)).toBeNull();
  });

  it('OCULTA bloco "420 meses" quando não há financiamento real', () => {
    const { queryByText } = renderWith({ financingBase: 0, termMonths: 120 });
    expect(queryByText(/Comparativo com Prazo de 420 Meses/)).toBeNull();
  });
});
