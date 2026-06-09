---
name: Financing Engine Canônica (Onda B2)
description: src/core/finance/financing é fonte única para Price/SAC/CET; UI/PDF/IA consumer-only; Math.pow financeiro proibido fora de core/finance
type: constraint
---

## Regra (Onda B2)

Toda matemática de financiamento (Price, SAC, CET, saldo, amortização, juros, PMT) DEVE viver em `src/core/finance/financing/` e ser consumida via fachada `@/core/finance`.

## API canônica
- `calculatePriceSchedule(input)` — tabela Price + totais (TR opcional).
- `calculateSacSchedule(input)` — tabela SAC + totais (TR opcional).
- `calculateFinancingCost(...)` — orquestrador legado (Price + SAC).
- `calculateCET({ principal, payments })` — Newton-Raphson + bissecção sobre VPL=0.
- Tipos: `FinancingResult`, `FinancingInstallment`, `FinancingScheduleInput`, `FinancingScheduleResult`, `CetInput`, `CetResult`.

## Proibido
- ❌ Recriar PMT, juros, amortização ou saldo em UI/PDF/hook/serviço.
- ❌ `Math.pow` para math financeiro fora de `core/finance/**` (lint error desde Onda B1).
- ❌ Importar de `core/finance/internal/*` ou `utils/calculations*` direto.
- ❌ Componentes recomporem `priceTable`/`sacTable`/`payment` — apenas leitura.

## Consumers atuais (todos consumer-only)
- `ComparatorModule.tsx`, `ProposalPdfModule.tsx`, `FinancingComparisonTab.tsx`, `SharedProposalPage.tsx`, `triggersData.ts`.

## Validação
- `src/test/financingEngineParity.test.ts` (6) — parity orquestrador, saldo→0, SAC constante, CET coerente.
- `src/test/financingTR.test.ts` (4) — regressão zero TR.
- 310/310 verdes.

**Why:** Onda B1 unificou investimento; restava Price/SAC/CET monolíticos em `internal/calculations.ts`. Promovido para namespace próprio, adiciona CET (antes inexistente) e fecha cerco institucional sobre toda matemática financeira do app.

Fontes: `.lovable/audit/financing-engine-unification-wave-b2.md`, `.lovable/audit/investment-engine-unification-wave-b1.md`.
