/**
 * InvestmentResultsContext — fonte única de leitura dos resultados de Investimento.
 *
 * REGRA: o cálculo continua sendo feito UMA ÚNICA VEZ em
 * `useInvestmentCalculations`, dentro do `InvestmentModule`. Este context apenas
 * PUBLICA esse resultado para que outros consumidores (notavelmente o
 * `ProposalPdfModule`) leiam exatamente os mesmos números — sem recalcular,
 * sem fallback divergente.
 *
 * NÃO recalcula. NÃO duplica lógica. NÃO oferece engine.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Assumptions, InvestmentCalculations, ScenarioResult } from '@/components/modules/investment/investmentTypes';
import type { CashComparisonResult } from '@/hooks/useCashComparison';

/**
 * Snapshot canônico das premissas usadas na sessão de Investimento.
 * Subset publicado para consumidores externos (notavelmente o PDF) sem
 * acoplar todo o tipo `Assumptions` interno do módulo.
 */
export interface InvestmentAssumptionsSnapshot {
  propertyAppreciation: number;
  investmentReturn: number;
  rentalYield: number;
  cdiPercent: number;
  cdiRate: number;
  analysisMonths: number;
}

/**
 * Snapshot canônico do cenário Consórcio × Compra à Vista.
 * Inclui o resultado completo do `useCashComparison` + o `propertyValue` e
 * o `termMonths` efetivos usados (necessários para narrativa do PDF).
 * NUNCA recalculado — espelha exatamente a UI.
 */
export interface CashComparisonSnapshot extends CashComparisonResult {
  propertyValue: number;
  termMonths: number;
}

export interface InvestmentResults {
  /** Cenário com maior `absoluteGain` (mesma regra usada no InvestmentModule). */
  bestStrategy: ScenarioResult | null;
  /** Renda mensal de aluguel (Path 3) — derivada do mesmo cálculo da UI. */
  incomeMonthly: number | null;
  /** Lucro absoluto na venda da cota (Path 2) — derivado do mesmo cálculo da UI. */
  saleProfit: number | null;
  /** Mês de contemplação efetivamente usado nos paths. */
  contemplationMonth: number | null;
  /** Snapshot raw dos paths (referência opcional para debug/análise). */
  calculations: InvestmentCalculations | null;
  /** ID do cenário recomendado (best absoluteGain). */
  recommendedId: string | null;
  /**
   * Premissas canônicas usadas na sessão (CDI, valorização, etc.).
   * Espelhadas do state `assumptions` do InvestmentModule.
   */
  assumptions: InvestmentAssumptionsSnapshot | null;
  /**
   * Snapshot do cenário Compra à Vista (engine `useCashComparison`).
   * Fonte ÚNICA consumida pelo PDF da Proposta Completa — sem heurística.
   */
  cashComparison: CashComparisonSnapshot | null;
  /** Marca de tempo da última publicação (debug). */
  publishedAt: number;
}

/** Helper para construir snapshot de premissas sem expor o tipo interno. */
export function toAssumptionsSnapshot(a: Assumptions): InvestmentAssumptionsSnapshot {
  return {
    propertyAppreciation: a.propertyAppreciation,
    investmentReturn: a.investmentReturn,
    rentalYield: a.rentalYield,
    cdiPercent: a.cdiPercent,
    cdiRate: a.cdiRate,
    analysisMonths: a.analysisMonths,
  };
}

interface Ctx {
  results: InvestmentResults | null;
  setResults: (r: InvestmentResults | null) => void;
}

const InvestmentResultsContext = createContext<Ctx>({
  results: null,
  setResults: () => {},
});

export function InvestmentResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<InvestmentResults | null>(null);
  const value = useMemo<Ctx>(() => ({ results, setResults }), [results]);
  return (
    <InvestmentResultsContext.Provider value={value}>
      {children}
    </InvestmentResultsContext.Provider>
  );
}

export function useInvestmentResults(): Ctx {
  return useContext(InvestmentResultsContext);
}
