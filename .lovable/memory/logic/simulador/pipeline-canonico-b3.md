---
name: Simulation Pipeline Canônico (Onda B3)
description: calculateSimulation é orquestrador puro; primitivas de parcela vivem em src/core/finance/installments; UI/PDF/IA consumem SimulationResult reconciliado
type: constraint
---

## Regra (Onda B3)

`calculateSimulation` (e seu alias `calculateSimulationLegacy`) é **orquestrador puro**: consome primitivas canônicas e coordena cenários de contemplação. NÃO contém aritmética financeira anônima.

## Primitivas canônicas (`src/core/finance/installments`)
- `computeAdminFee(creditValue, adminFeePercent)`
- `computeReserveFund(creditValue, reserveFundPercent)`
- `computeBaseCost(creditValue, adminFee, reserveFund)`
- `computeFullInstallment(totalCost, termMonths)` — safeDivide
- `computeReducedInstallment(fullInstallment, enabled)` — fator REDUCED_INSTALLMENT_FACTOR
- `computeRedilutedInstallment(...)` — déficit / meses restantes
- `getReducedInstallmentMonths(type, enabled)` — tabela MAX_REDUCED por tipo

## Pipeline oficial
```
installments + financing + investment + prestamista + monthlySchedule
   ↓
calculateSimulation (orquestrador)
   ↓
SimulationResult (legado) ──► reconcileWithSchedule ──► SimulationResult RECONCILIADO
                                                              ↓
                                       UI / Charts / PDF / IA / Analytics (consumer-only)
```

## Proibido
- ❌ Recriar `creditValue * adminFeePercent / 100` ou `totalCost / termMonths` em qualquer lugar fora de `installments/`.
- ❌ Aplicar `REDUCED_INSTALLMENT_FACTOR` direto — usar `computeReducedInstallment`.
- ❌ Adicionar nova matemática dentro de `calculateSimulation` — apenas orquestração de cenário.
- ❌ Componentes recomporem parcela, totais, seguro, patrimônio ou saldo — sempre consumir o `SimulationResult` reconciliado via `useSimulatorContext()`.

## Validação
- `src/test/simulationResultGoldenSnapshot.test.ts` (3) — trava forma e valores chave.
- `src/test/installmentSingleSourceOfTruth.test.ts` — drift zero parcela canônica.
- 313/313 verdes.

**Why:** Onda B2 fechou Price/SAC/CET. Onda B3 fecha o último núcleo híbrido (`calculateSimulation`), promovendo a aritmética de bookkeeping para namespace institucional próprio (`installments`). Math byte-a-byte preservada — refator arquitetural, não matemático.

Fontes: `.lovable/audit/canonical-simulation-pipeline-wave-b3.md`, `.lovable/audit/financing-engine-unification-wave-b2.md`.
