---
name: BidsStudyContext fonte única
description: Context global publica resultados de analyzeBidHistory; ProposalPdfModule consome bidsStudy (sem recalcular); BidsModule é o único produtor
type: feature
---
Mesmo padrão do `InvestmentResultsContext`, agora para o Estudo de Lances.

- **Produtor único**: `BidsModuleContent` lê `bidAnalysis` do `BidsContext` interno (já produzido por `analyzeBidHistory`) e publica via `useBidsStudyResults().setResults({ groupNumber, avgBid, minBid, maxBid, recommendedBid, monthsAnalyzed, publishedAt })`.
- **Mapeamento (todos em % do crédito)**: `avgBid = stats.avgOfAvgBids`, `minBid = stats.minOfMinBids`, `maxBid = stats.maxOfMaxBids`, `recommendedBid = recommendation.primaryBid`, `monthsAnalyzed = months.length`.
- **Provider**: `BidsStudyProvider` (em `src/contexts/BidsStudyContext.tsx`), montado em `Index.tsx` dentro de `InvestmentResultsProvider`.
- **Consumidor**: `ProposalPdfModule.buildData()` lê `useBidsStudyResults()` e popula `data.bidsStudy`. Os gates `hasBidsStudyData` em `PdfPropostaCompleta` aprovam quando há dados.
- **Façade**: `src/contexts/proposal/index.ts` expõe `useProposalData()` retornando `{ simulation, diagnostic, journey, investment, bidsStudy }`. Apenas leitura — não mantém estado próprio, não recalcula. Ponto único de entrada para a Proposta/PDF preservando as fontes únicas existentes.
- **Regra**: nenhum recálculo de lances fora de `analyzeBidHistory`. Se o usuário não abriu o módulo Lances, `bidsStudy` é `null` e os blocos correspondentes são descartados pelo gate de integridade.
