---
name: Investment Engine Canonical
description: Toda matemática de juros compostos / INCC / Price PMT / equivalência de taxas vive em src/core/finance/investment; UI/hook/PDF é consumer-only
type: constraint
---

## Regra (Onda B1)

Todo cálculo de juros compostos, INCC composto, equivalência de taxas e
Price PMT DEVE ser importado de `@/core/finance` (primitivas em
`src/core/finance/investment/`).

## API canônica

- `annualToMonthlyRate(i)` — `(1+i)^(1/12) − 1`
- `monthlyToAnnualRate(i)` — `(1+i)^12 − 1`
- `compoundGrowth(P, r, n)` — `P × (1+r)^n`
- `compoundGrowthAnnualMonthly(P, iAnual, meses)`
- `futureValueOfSeries(PMT, r, n)` — `PMT × ((1+r)^n − 1)/r`
- `inccAdjust(base, %a, meses)` / `inccAdjustYears(base, %a, anos)`
- `pricePmt(P, r, n)` / `pricePmtAnnualMonthly`
- `calculateInvestmentProjection({ principal, monthlyContribution, annualReturnRate, months })`

## Proibido

- ❌ `Math.pow(1 + ...)` em hook/componente/gráfico/card/tab/serviço (lint guard `no-restricted-syntax`).
- ❌ Recriar `annualToMonthlyRate` / Price PMT / FVS inline.
- ❌ INCC composto fora da engine.

## Allowlist legítima (não-financeira)

- `src/utils/bidAnalysis/**` — variância estatística.
- `src/components/ui/percent-input.tsx` — `Math.pow(10, n)` para arredondamento decimal.

## Why

Pré-B1: 5 hot spots (useInvestmentCalculations, useCashComparison,
ScenarioComparisonChart, CotaMultiplicationCard, FinancingComparisonTab) +
ProposalPdfModule, SharedProposalPage, triggersData mantinham fórmulas
paralelas. Sem governance, qualquer card ou gráfico podia divergir do
hook que originou os números. Engine canônica + lint guard fecham o cerco.

## Validação

- `src/test/investmentEngineParity.test.ts` (novo) — paridade primitiva-a-primitiva.
- `src/test/investmentCalculationsParity.test.ts` — snapshot dos 6 paths permanece estável.
- 304/304 testes verdes pós-migração.

## Ondas futuras

B2 (financing engine) → B3 (cards consumer-only via `InvestmentResultsContext`) →
B4 (cashImpact em service) → B5 (CI parity check) → B6 (deprecar
`calculateSimulationLegacy`).
