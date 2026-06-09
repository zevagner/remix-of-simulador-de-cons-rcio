---
name: Parcela canônica via reconcileWithSchedule
description: Onda A — fullInstallment, reducedInstallmentValue e redilutedInstallmentValue do SimulationResult são canônicos pós-reconcile; nenhum consumer recompõe parcela localmente
type: constraint
---

Pós-Onda A (Single Source of Truth da Parcela):

- `result.fullInstallment` = `(creditValue + adminFee + reserveFund + schedule.totalInsurance) / termMonths`
  (derivado dentro de `reconcileWithSchedule`, motor mensal canônico).
- `result.reducedInstallmentValue` = `fullInstallment × REDUCED_INSTALLMENT_FACTOR` (canônico).
- `result.redilutedInstallmentValue` = derivado por déficit/meses restantes sobre o canônico.
- `reconcileWithSchedule` aceita `creditValue` em `ReconcileOptions` para precisão exata; SimulatorContext sempre passa.

**Proibido**:
- Recriar `totalPlan = credit + adm + FR + insAvg×N` em components.
- Calcular `fullInstallment` localmente em qualquer view.
- PDF usar `firstRow.payment` isolado para "Parcela Inicial" — ler `result.fullInstallment`.

**Why:** drift histórico de até R$50/parcela entre card Resultados, Composição e PDF foi eliminado. Qualquer recálculo local reintroduz divergência estrutural.

Fontes: `.lovable/audit/simulator-single-source-of-truth-audit.md`, `src/test/installmentSingleSourceOfTruth.test.ts`.
