/**
 * BidsStudyContext — fonte única de leitura dos resultados do Estudo de Lances.
 *
 * Mesmo padrão do `InvestmentResultsContext`:
 *  - O cálculo continua em `analyzeBidHistory` / `BidsContext` interno do módulo.
 *  - Este context apenas PUBLICA o resultado para outros consumidores
 *    (notavelmente o `ProposalPdfModule`), sem recalcular.
 *
 * NÃO recalcula. NÃO duplica lógica. NÃO oferece engine.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface BidsStudyResults {
  /** Número do grupo selecionado (string para preservar zeros à esquerda). */
  groupNumber: string;
  /** Lance médio histórico — % do crédito. */
  avgBid: number;
  /** Lance mínimo histórico — % do crédito. */
  minBid: number;
  /** Lance máximo histórico — % do crédito. */
  maxBid: number;
  /** Lance recomendado (BidRecommendation.primaryBid) — % do crédito. */
  recommendedBid: number;
  /** Quantidade de meses de assembleia analisados. */
  monthsAnalyzed: number;
  /** Marca de tempo da última publicação (debug). */
  publishedAt: number;
}

interface Ctx {
  results: BidsStudyResults | null;
  setResults: (r: BidsStudyResults | null) => void;
}

const BidsStudyContext = createContext<Ctx>({
  results: null,
  setResults: () => {},
});

export function BidsStudyProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<BidsStudyResults | null>(null);
  const value = useMemo<Ctx>(() => ({ results, setResults }), [results]);
  return (
    <BidsStudyContext.Provider value={value}>
      {children}
    </BidsStudyContext.Provider>
  );
}

export function useBidsStudyResults(): Ctx {
  return useContext(BidsStudyContext);
}
