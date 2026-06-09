---
name: Contextual Help System
description: Onda Contextual Help — registry @/lib/contextualHelp/registry com surfaces (≤3 articleIds + ≤2 insights + riskNote opcional); componentes oficiais HelpHint (popover) e ContextualInsightStrip (inline); política docs/help/contextual-help-policy.md; conteúdo SEMPRE em helpContent.ts
type: feature
---
**Camada de ajuda contextual integrada à operação.**

> Onda Executive Help Center Modernization Pass (2026-05) adicionou 3 capítulos institucionais em `helpContent.ts`: `diagnostico` (4 artigos), `proposta` (4 artigos), `ia-consultiva` (3 artigos). Estrutura final = 12 capítulos consultivos cobrindo todos os módulos V2. Audit: `.lovable/audit/executive-help-center-modernization-pass.md`.

## Arquitetura
- **Registry oficial**: `src/lib/contextualHelp/registry.ts` mapeia `surfaceId` → `{ title, summary, articleIds, insights, riskNote }`. NÃO duplica conteúdo — só referencia `helpContent.ts`.
- **Componentes oficiais** (`src/components/help/`):
  - `HelpHint surfaceId="..."` — ícone (i) discreto, popover com summary + insights + artigos. Usar em pontos de configuração/decisão.
  - `ContextualInsightStrip surfaceId="..."` — faixa inline sempre visível com 1 insight. Usar pós-resultado para guided interpretation.
- **Política**: `docs/help/contextual-help-policy.md`.

## Surfaces registrados (10)
simulator.installment-composition · simulator.reduced-installment · simulator.bid-types · investment.scenarios · investment.incc · comparator.financing · comparator.sac-price · comparator.cash-leverage · op.structured · carteira.cadence · community.ask

## Regras
- ≤3 articleIds e ≤2 insights por surface; 1 riskNote opcional.
- Tom institucional sem verbos de marketing.
- Proibido `title=""` ad-hoc em pontos críticos — usar `HelpHint`.
- Mudanças de explicação vão em `helpContent.ts`, NUNCA no registry.
- Telemetria opcional via `trackHelpInteraction(surfaceId, action)` — sem PII.

## Wired (Onda 1)
- `SimulatorResultsSection` → `simulator.installment-composition`
- `FinancingComparisonTab` → `comparator.sac-price` (HelpHint) + `comparator.financing` (Strip)
- `InvestmentAssumptions` → `investment.scenarios` + `investment.incc`
