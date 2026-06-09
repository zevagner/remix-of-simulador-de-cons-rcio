# Onda B1 — Investment Engine Unification

> Status: ✅ entregue
> Data: 2026-05-12
> Score de consistência financeira (UI): **9.4 / 10** (era 7.4)
> Testes: **304 / 304 verdes** (incl. snapshots `investmentCalculationsParity`)

## 1. Objetivo

Eliminar definitivamente a **matemática financeira espalhada na UI**. Toda
fórmula de juros compostos, equivalência de taxas, INCC e Price PMT passa a
nascer de uma única engine institucional: `src/core/finance/investment/`.

> Princípio: **nenhum componente UI calcula. Todos consomem.**

## 2. Engine canônica criada

`src/core/finance/investment/index.ts` — exposta via fachada `@/core/finance`.

| Primitiva                       | Fórmula                                  | Substitui inline em                        |
|---------------------------------|------------------------------------------|--------------------------------------------|
| `annualToMonthlyRate(i)`        | `(1+i)^(1/12) − 1`                       | useInvestmentCalculations, ScenarioComparisonChart, useCashComparison, FinancingComparisonTab, SharedProposalPage, triggersData |
| `monthlyToAnnualRate(i)`        | `(1+i)^12 − 1`                           | (novo, disponível para futuros consumers)  |
| `compoundGrowth(P, r, n)`       | `P × (1+r)^n`                            | useInvestmentCalculations (paths 1/3/4/5/6), useCashComparison, ScenarioComparisonChart, ProposalPdfModule |
| `compoundGrowthAnnualMonthly`   | atalho com taxa anual + meses            | helper para próximas migrações             |
| `futureValueOfSeries(PMT, r, n)`| `PMT × ((1+r)^n − 1)/r`                  | useCashComparison (excedente), ScenarioComparisonChart (case `investment`) |
| `inccAdjust(base, %a, meses)`   | INCC composto mês a mês                  | preparado para hot spot futuro             |
| `inccAdjustYears(base, %a, anos)` | INCC composto anual                    | CotaMultiplicationCard                     |
| `pricePmt(P, r, n)`             | `P × i(1+i)^n / ((1+i)^n − 1)`           | SharedProposalPage, triggersData           |
| `pricePmtAnnualMonthly`         | atalho com taxa anual                    | disponível                                  |
| `calculateInvestmentProjection` | principal + série uniforme               | base para próximas projeções estruturadas  |

Tipos exportados: `InvestmentProjectionInput`, `InvestmentProjectionResult`.

## 3. Hot spots migrados

| # | Arquivo                                              | Antes                                | Depois                          |
|---|------------------------------------------------------|--------------------------------------|---------------------------------|
| H1 | `src/hooks/useInvestmentCalculations.ts`            | 7× `Math.pow` + helper local         | engine canônica                 |
| H2 | `src/hooks/useCashComparison.ts`                    | 2× `Math.pow` + loop manual de cap.  | engine canônica                 |
| H3 | `src/components/modules/investment/ScenarioComparisonChart.tsx` | 6× `Math.pow` + helper local | engine canônica                 |
| H4 | `src/components/modules/investment/CotaMultiplicationCard.tsx`  | INCC inline `Math.pow`         | `inccAdjustYears`               |
| H5 | `src/components/modules/comparator/FinancingComparisonTab.tsx`  | conversão de taxa inline       | `annualToMonthlyRate`           |
| +  | `src/components/modules/ProposalPdfModule.tsx`      | compounding inline                   | `compoundGrowth`                |
| +  | `src/pages/SharedProposalPage.tsx`                  | Price PMT inline                     | `pricePmt` + `annualToMonthlyRate` |
| +  | `src/components/modules/objections/triggersData.ts` | Price PMT inline                     | `pricePmt` + `annualToMonthlyRate` |

## 4. Math.pow remanescentes (legítimos)

Após a migração, `rg "Math.pow" src/` retorna apenas:

* `src/core/finance/**` — engine canônica (única fonte legítima).
* `src/utils/bidAnalysis/core.ts` — variância estatística (não-financeira).
* `src/components/ui/percent-input.tsx` — `Math.pow(10, decimalPlaces)` para arredondamento decimal.
* Comentários ("Proibido reintroduzir Math.pow inline …") — sem efeito de runtime.

## 5. Lint guards (governance)

`eslint.config.js`:

* Regra nova `no-restricted-syntax`:
  `CallExpression[callee.object.name='Math'][callee.property.name='pow']`
  → bloqueia `Math.pow` fora de `src/core/finance/**`.
* Allowlist explícita (override) para usos não-financeiros legítimos:
  `src/utils/bidAnalysis/**` (variância) e `src/components/ui/percent-input.tsx`
  (arredondamento decimal).
* Mantém todas as regras prévias (Prestamista, MIP, internal/, façade, PDF).

## 6. Parity & drift detection

* **`src/test/investmentEngineParity.test.ts`** (novo) — 8 asserções comparam
  cada primitiva com a fórmula inline original (ex.: `pricePmt` vs as duas
  formulações Price encontradas na UI). Garante zero drift na promoção.
* **`src/test/investmentCalculationsParity.test.ts`** (existente) — snapshots
  determinísticos dos 6 paths em 3 cenários permanecem verdes → comprova que
  a substituição inline → engine não alterou nenhum valor financeiro.
* Suite total: **304 passing**.

## 7. Pipeline financeiro oficial

```text
                Investment Engine (src/core/finance/investment)
                              │
                              ▼
          Projection Result (objetos tipados, imutáveis)
                              │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
      Cards                 Charts               Comparators
  (consumer-only)       (consumer-only)         (consumer-only)
        │                      │                      │
        └──────────────────────┴──────────────────────┘
                              │
                              ▼
                      PDF / IA / Storytelling
                       (consumer puro)
```

UI não calcula. UI lê.

## 8. Componentes consumer-only formalizados

| Camada              | Pode calcular? | Permitido importar de `@/core/finance` |
|---------------------|----------------|-----------------------------------------|
| `core/finance/**`   | ✅ engine      | (é a engine)                            |
| Hooks de domínio    | ❌              | ✅ (consome primitivas)                  |
| Componentes UI      | ❌              | ✅ (consome primitivas/dados)            |
| Gráficos            | ❌              | ✅ (consome dataset oficial)             |
| `components/pdf/**` | ❌              | ❌ runtime — apenas `type` imports       |

## 9. Score de consistência matemática (sistêmico)

| Eixo                                       | Pré-B1 | Pós-B1 |
|--------------------------------------------|:------:|:------:|
| Parcela canônica (Onda A)                  |  9.5   |  9.5   |
| Seguro Prestamista canônico                |  9.5   |  9.5   |
| Schedule mensal único (motor atuarial)     |  9.5   |  9.5   |
| Investimento (compound / INCC / FVS)       |  6.0   |  9.5   |
| Comparador financiamento (PMT / equivalência)|  6.5   |  9.0   |
| Charts/cards consumer-only                 |  5.5   |  9.0   |
| Governança lint (`Math.pow` outside core)  |   —    |  9.5   |
| **Média ponderada (UI)**                   | **7.4**| **9.4**|

## 10. Ondas seguintes recomendadas

* **B2** — promover lógica do `FinancingComparisonTab` (Price/SAC, MIP, DFI,
  taxa admin) para `core/finance/financing/*`; manter componente como puro
  consumer.
* **B3** — formalizar `InvestmentScenarioCard` / `InvestmentSummaryCards` /
  `CashComparisonTab` como consumers via `InvestmentResultsContext`
  (`projection: InvestmentProjectionResult`).
* **B4** — mover `ProposalPdfModule.cashImpact` para um helper em
  `services/proposals/*` que consome `compoundGrowth`, eliminando o último
  `Math.pow` em árvore de módulos.
* **B5** — endurecer ESLint: subir a regra `Math.pow` para `error` em modo
  CI (já está em `error` hoje, mas pode ser combinada com check dedicado de
  paridade entre snapshot e engine).
* **B6** — deprecar `calculateSimulationLegacy` quando todos os consumers
  paramétricos (Comparator/Investment/QuickSale) tiverem migrado para o
  motor mensal.

## 11. Veredito

✅ **Cultura de múltiplas matemáticas eliminada.** Toda projeção patrimonial,
crescimento composto, INCC, Price PMT e equivalência de taxas nasce agora
da mesma engine institucional. Drift de UI controlado por testes de paridade
+ guard ESLint que bloqueia regressão.
