/**
 * StructuredOpsResultsContext — fonte única de leitura da Operação Estruturada
 * multi-cartas. Publicada pelo `StructuredOperationsModule`; consumida pelo
 * `ProposalPdfModule` para integrar a operação no PDF SEM recalcular nada.
 *
 * REGRA: este context NÃO calcula. Apenas espelha o que o módulo já exibe.
 * Se o usuário nunca abriu o módulo na sessão, `results === null` e os gates
 * de integridade descartam o bloco silenciosamente.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ConsolidatedResult, CardResult } from '@/components/modules/structured-ops/structuredOpsTypes';

export interface StructuredOpsResults {
  consolidated: ConsolidatedResult;
  cards: CardResult[];
  cardsCount: number;
  effectiveRate: number;
}

interface Ctx {
  results: StructuredOpsResults | null;
  setResults: (r: StructuredOpsResults | null) => void;
}

const StructuredOpsResultsCtx = createContext<Ctx>({ results: null, setResults: () => {} });

export function StructuredOpsResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<StructuredOpsResults | null>(null);
  const value = useMemo(() => ({ results, setResults }), [results]);
  return <StructuredOpsResultsCtx.Provider value={value}>{children}</StructuredOpsResultsCtx.Provider>;
}

export function useStructuredOpsResults(): Ctx {
  return useContext(StructuredOpsResultsCtx);
}
