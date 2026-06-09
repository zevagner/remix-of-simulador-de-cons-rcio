---
name: Motor atuarial mensal refinado
description: calculateMonthlySchedule paralelo refinado — seguro sobre saldo médio, taxa por idade (getInsuranceRate), lance ANTES da amortização, reajuste anual ponderado (adm 50%), separação de custos (costPlan/costWithInsurance/effectiveClientCost). Validação idade+prazo ≤ 79a 11m 29d. Não substitui calculateSimulation legado.
type: feature
---

`src/utils/calculations/monthlySchedule.ts` — motor paralelo, contrato público estável.

Ordem mensal:
1. Reajuste anual ponderado (mês 13/25/...): crédito×r, adm×(r·0.5), FR×r
2. Snapshot balanceStart
3. **Lance aplicado ANTES da amortização** (proporcional aos 3 componentes)
4. Recalcula postBidInstallment se contemplação no mês
5. Amortização proporcional sobre balanceAfterBid
6. **Seguro sobre saldo médio**: `(balanceAfterBid + balanceEnd) / 2 × getInsuranceRate(currentAge)`

`getInsuranceRate(age)`: ≤30→0.0004, ≤45→0.0006, ≤60→0.0010, >60→0.0015 (fallback: sim.insurancePercent quando proponentAge=0).

Resultado adiciona `totalInstallmentsPaid`, `costPlan`, `costWithInsurance` (campos novos, não-quebrantes).
