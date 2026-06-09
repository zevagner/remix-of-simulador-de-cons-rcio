---
name: Fairness Financeira (Fase 1)
description: Onda Fairness — TR opcional no calculateFinancingCost, toggles INCC×TR no Comparador (default OFF), Comparator migrado para motor mensal canônico via reconcileWithSchedule. Investment/PDF mantêm uso paramétrico legítimo até Onda 2.
type: feature
---

**Toggles (Comparator):**
- INCC/IPCA — `applyConsortiumAdjustment` + `consortiumAdjustmentPercent` (default 4%, 0-15). OFF default.
- TR — `applyTR` + `trMonthlyRate` (default 0,10% a.m., 0-2). OFF default.
- Badge âmbar "comparação corrigida parcialmente" só aparece em XOR.

**TR no `calculateFinancingCost`** (`src/core/finance/internal/calculations.ts`):
- Param opcional `trMonthlyRate=0` (8º arg). TR=0 → comportamento legado **idêntico** (regressão zero validada).
- Com TR > 0: saldo `*= (1+trRate)` antes de juros. Price recalcula PMT mês a mês; SAC amort = saldo/prazo_restante. Saldo→0 garantido.

**Comparator → motor mensal:** `consortium1ResultBase` e `consortium2Result` agora usam `calculateMonthlySchedule + reconcileWithSchedule` (mesma fachada do `SimulatorContext`). Elimina divergência silenciosa.

**Pendente Onda 2:** Investment/decisionEngine/PDF ainda usam `calculateSimulationLegacy` (uso paramétrico documentado). CET/TIR fora do escopo.

**Testes:** `src/test/financingTR.test.ts` (4) + `src/test/comparatorEngineParity.test.ts` (2). Suíte total: 224/224.
