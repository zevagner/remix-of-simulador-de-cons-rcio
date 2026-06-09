---
name: Wealth → Proposal Parametric Continuity
description: Premissas vivas do WealthAssumptionsContext atravessam o Proposal PDF via readWealthCalcContextFromStorage; provider permanece scoped ao WealthPlatformModule
type: feature
---
**Onda Wealth-to-Proposal Executive Continuity:** `WealthAssumptionsProvider` é scoped a `WealthPlatformModule` (não global). Para preservar `calcContext` (CDI, contemplação, yield, ágio, valorização) em módulos fora dessa árvore (ex.: `ProposalPdfModule`), usar:

```ts
import { useWealthAssumptionsSafe, readWealthCalcContextFromStorage } from '@/contexts/WealthAssumptionsContext';
const calcCtx = useWealthAssumptionsSafe()?.calcContext ?? readWealthCalcContextFromStorage();
```

`readWealthCalcContextFromStorage()` é leitura síncrona pura (localStorage `wealth:assumptions:v1` → `toCalcContext`). Sem React, sem subscriptions.

**Proibido:** hoist do `WealthAssumptionsProvider` para `App.tsx` (viola V2 lock de scope) ou criação de snapshot duplicado em outro context. O bloco `wealth-thesis` do PDF (`ProposalPdfModule` → `lib.calculations[].result(credit, ctx)`) é o consumer canônico fora do Wealth.

Audit: `.lovable/audit/wealth-to-proposal-executive-continuity-pass.md`.
