---
name: InvestmentResultsContext fonte única
description: Context global publica resultados de useInvestmentCalculations; ProposalPdfModule consome (sem recalcular); InvestmentModule é o único produtor
type: feature
---
Arquitetura para evitar duplicação de cálculo de investimento entre UI e PDF:

- **Produtor único**: `InvestmentModule` chama `useInvestmentCalculations` e, via `useEffect`, publica em `useInvestmentResults().setResults({ bestStrategy, incomeMonthly: path3.monthlyRent, saleProfit: path2.absoluteGain, contemplationMonth, calculations, publishedAt })`.
- **Provider**: `InvestmentResultsProvider` (em `src/contexts/InvestmentResultsContext.tsx`), montado em `Index.tsx` dentro de `ClientJourneyProvider`.
- **Consumidor**: `ProposalPdfModule.buildData()` lê `useInvestmentResults()` e popula `strategy.incomeMonthly`, `strategy.saleProfit`, `strategy.contemplationMonth`. Os gates `hasStrategyData('strategy-income'|'strategy-sell')` em `PdfPropostaCompleta` agora aprovam quando há dados reais.
- **Regra**: nenhum recálculo de investimento fora de `useInvestmentCalculations`. Se o usuário não abriu o módulo Investimento na sessão, `investment` é `null` e os blocos correspondentes são descartados pelo gate de integridade — sem fallback fake.
