---
name: patrimonial-timeline
description: Motor determinístico de projeções patrimoniais 5/10/15 anos por arquétipo de estratégia, com componente visual stacked-bar CSS e comparador longitudinal. Consumer-only, premissas explícitas (valorização 2% a.a., aluguel 0,45% a.m., CDI 9% a.a.).
type: feature
---
**Engine:** `src/core/finance/investment/patrimonialTimeline.ts` — `projectPatrimonialTimeline({archetype, creditValue, ownCapitalInvested, preservedCapital})` retorna marcos 0/5/10/15a com `controlledAsset`/`preservedCapital`/`annualIncome`/`multiplier`/`phase`/`narrative`. 6 arquétipos (autoquitacao/escada-patrimonial/renda-passiva/construcao-inteligente/multiplicacao-ativos/holding-sucessao) com lógica diferenciada.

**Visual:** `PatrimonialTimeline.tsx` (stacked CSS bars, collapsible no StrategyCard) + `PatrimonialTimelineComparator.tsx` (picker até 3 estratégias, tabela Y5/Y10/Y15). Sem Recharts, sem state pesado.

**Premissas conservadoras** explicitadas em tooltip + disclaimer; badge "Estimativa" sempre visível. Zero alteração em motores financeiros / Supabase / providers.
