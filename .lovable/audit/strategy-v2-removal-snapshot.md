# Snapshot Arquitetural — `strategy-v2` (pré-remoção Wave 2)

Data: Wave 2 (Legacy Cleanup — definitive removal).
Status: árvore **removida** após este snapshot. Documento serve como
memória institucional dos conceitos que podem ser reaproveitados em
futuras evoluções da arquitetura única consolidada.

## Por que removida

- `ENABLE_STRATEGY_PRESENTATION_V2 = false` (constante hardcoded).
- `CompareSelectionProvider` **nunca foi montado** em `AppProviders.tsx`
  nem em nenhum runtime tree — `useCompareSelection` retornava sempre o
  fallback no-op.
- Branches V2 em `InvestmentModule` e `PatrimonialModule` eram código
  morto gated por flag desligada.
- `AdminStrategyV2Insights` sem rota/admin page que o importasse.
- 5 suítes de teste cobrindo só código gated → manutenção sem retorno.

## Estrutura original (11 arquivos)

```text
src/components/modules/strategy-v2/
├── index.ts                          (barrel)
├── contracts.ts                      (KpiKind, StrategyBlueprint,
│                                      StrategyPresentationData,
│                                      ComparePayload, StrategyApplication,
│                                      StrategyArchetype, ConsultiveContent)
├── blueprint.ts                      (STRATEGY_BLUEPRINT_BY_ID curado)
├── adapters.ts                       (adaptInvestmentScenario,
│                                      adaptPatrimonialStrategy, KPI_LABELS)
├── tokens.ts                         (ENTER_ANIMATION_CLS etc.)
├── telemetry.ts                      (ring buffer in-memory de eventos U8)
├── hooks/
│   └── useStrategyV2Telemetry.ts
├── CompareSelectionContext.tsx       (selectedIds + sessionStorage
│                                      `strategyV2:compareSelection:v1`)
├── ExecutiveStrategyCard.tsx         (Layer 1 — hero KPI + identidade)
├── ConsultiveStrategyPanel.tsx       (Layer 2 — tese profunda + accordion)
├── CompareWorkspace.tsx              (Layer 3 — workspace de decisão até 3)
└── FinancialFlowVisual.tsx           (visual de fluxo financeiro)
```

Componentes V2-dependentes também removidos:
- `src/components/modules/investment/InvestmentScenariosV2.tsx`
- `src/components/modules/patrimonial/PatrimonialStrategiesV2.tsx`
- `src/components/admin/AdminStrategyV2Insights.tsx`
- 5 testes `src/test/strategyPresentationV2*`

## Conceitos / decisões que VALE preservar (reaproveitar se necessário)

1. **Camada Executive → Consultive → Compare** (Layer 1/2/3) — modelo
   mental válido; já está implementado de forma diferente na arquitetura
   consolidada (Wealth `StrategyLibrarySection` + `ConsultiveBridge` +
   `WealthPdfButton`).
2. **Separação Blueprint (editorial) × KPIs (motor)** — princípio
   mantido em `STRATEGY_LIBRARY` (Wealth) e `strategyExecutiveKpis.ts`.
3. **`StrategyApplication` flagship** — conceito preservado em
   `strategyLibraryData.ts` (memória `flagship-discoverability-layer`).
4. **`COMPARE_MAX = 3`** — limite institucional preservado na constituição
   V2 (Production Lock V2.4) e enforced em CompareWorkspace **legacy**
   (não existe mais; se reintroduzir Compare na arquitetura única, herdar
   o limite via constante explícita).
5. **Telemetry taxonomy U8** (`getStrategyV2EventBuffer`) — ring buffer
   in-memory zero-overhead; padrão reutilizável se for necessário medir
   superfícies novas. Não estava conectado a analytics persistido.
6. **ConsultiveContent (DR-1)** — campos `applications`/`archetypes`/
   `whenNotToUse`/`patrimonialImpact`/`storytellingIntro`/`executiveTrigger`/
   `humanTranslation` foram preservados via `strategyLibraryData.ts`
   (consumidos pelo `ConsultiveStrategyPanel` da Wealth, que é outra
   implementação — não a desta árvore removida).

## Persistências removidas

| Chave | Storage | Owner removido |
|---|---|---|
| `strategyV2:compareSelection:v1` | `sessionStorage` | `CompareSelectionContext` (removido) |
| `strategyV2` (override flag) | `localStorage` | `isStrategyPresentationV2Enabled` (função removida) |

Limpeza idempotente em `src/utils/storage/wave2Sanitize.ts` (flag
`wave2:sanitized:v1`).

## Não tocado

A arquitetura única consolidada permanece intacta:
- `src/components/modules/wealth/*` (Wealth Platform Module + Strategy
  Library Section + WealthPdfButton modo "Tese atual")
- `src/components/modules/investment/InvestmentScenarioCard.tsx` (V1)
- `src/components/modules/patrimonial/PatrimonialStrategyCard.tsx` (V1)
- `src/contexts/ActiveStrategyContext.tsx`
- `src/contexts/InvestmentResultsContext.tsx` (com `presentations`
  removido)
- `src/core/finance/*`
- PDFs (`PdfEstrategiaPatrimonial` modo single preservado)
