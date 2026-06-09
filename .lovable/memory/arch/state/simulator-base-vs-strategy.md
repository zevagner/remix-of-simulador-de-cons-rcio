---
name: Simulator base vs strategy schedules
description: SimulatorContext expõe baseMonthlySchedule/baseResult (estrutura ORIGINAL do plano) separados de monthlySchedule/result (cenário com contemplação/lance). Card "Resultados da Simulação" SEMPRE consome base; cenário pós-contemplação consome strategy.
type: feature
---

`SimulatorContext` (src/components/modules/simulator/SimulatorContext.tsx) expõe DOIS pares de derivados:

- **base** (estrutura original): `baseMonthlySchedule`, `baseResult`
  - construídos com `freeBidValue=0`, `embeddedBidValue=0`, `contemplated=false`, `postLanceChoice='reduce-installment'`
  - mantém: seguro (toggle), desconto adm, parcela reduzida (premissas estruturais)
  - imune a toggles de contemplação/lance
- **strategy** (cenário do consultor): `monthlySchedule`, `result`, `resultWithoutDiscount`, `effectiveClientCost`
  - reflete contemplação, lance, postLanceChoice escolhidos

Regra de uso:
- Card "Resultados da Simulação" (`SimulatorResultsSection`) → SEMPRE base.
- Card "Cenário Pós-Contemplação" (`SimulatorContemplationCard`, ancora `#post-contemplation-scenario`) → strategy.
- PDF/Analysis/Comparator → continuam consumindo `monthlySchedule`/`result` (estratégia, comportamento original).
- Snapshot da Comunidade → reflete strategy (cenário do consultor).

Badge "Estratégia aplicada ↓" no header do card base aparece quando `contemplated || freeBid>0 || embeddedBid>0` e linka para o anchor.

Invariância validada em `src/test/baseScheduleInvariance.test.ts` (7 cenários).
