---
name: Blindagem calculateSimulation
description: monthlySchedule é fonte única; calculateSimulation só no SimulatorContext; calculateSimulationLegacy para cenários paramétricos alternativos
type: constraint
---
- `monthlySchedule` (motor mensal) é a ÚNICA fonte de verdade financeira.
- `calculateSimulation` só pode ser chamado dentro do `SimulatorContext` (uso produtivo único) — alimenta `reconcileWithSchedule`.
- Chamadas fora disso disparam `console.warn` único em dev (flag global `__calcSimAllowedCaller`).
- Cenários paramétricos alternativos (taxas/idade diferentes da sessão atual) devem importar `calculateSimulationLegacy` — alias que silencia o warning e documenta intenção. Hoje usado em: `useInvestmentCalculations`, `ComparatorModule`, `QuickSaleMode`, `decisionEngine` (auditoria).
- `PdfSimulador` exibe warning se `monthlySchedule` não for passado (fallback legado existe mas é regressão silenciosa).
- **Why:** Evitar divergência entre tela, PDF e IA — o motor mensal trata seguro decrescente, lance proporcional e custo efetivo corretamente.
