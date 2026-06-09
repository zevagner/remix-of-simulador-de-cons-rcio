# Storage Keys — Ownership Map (V2.4 LOCKED)

Última atualização: **Wave 2 (Strategy V2 Definitive Removal)**.

Mapa canônico de chaves `localStorage` / `sessionStorage` da plataforma.
Cada chave tem **um único** Source of Truth (provider/módulo responsável
por escrever) e uma lista explícita de consumers. Adicionar nova chave
exige entrada nesta tabela — proibido novo "shadow storage".

## Ownership canônico (runtime)

| Domínio | Source of Truth (Provider único) |
|---|---|
| Simulação financeira | `SimulatorContext` |
| Estratégias patrimoniais (cálculo) | `StrategyCalcContext` |
| Premissas patrimoniais | `WealthAssumptionsContext` |
| Navegação entre módulos | `ModuleNavigationProvider` / `navState.ts` |
| Estratégia ativa (Wealth ↔ Proposta) | `ActiveStrategyContext` |

Zero providers paralelos. Zero contexts concorrentes. Zero ownership duplicado.

## Estado das chaves

| Chave | Tipo | Source of Truth | Consumidores | Status |
|---|---|---|---|---|
| `strategy:sim-slice:v1` | LS | `SimulatorContext` (write) | `WealthAssumptionsContext.readSimSliceFromStorage`, PDF off-screen | ✅ ativo (canônico) |
| `wealth:assumptions:v1` | LS | `WealthAssumptionsContext` | mesmo provider; `readWealthCalcContextFromStorage` (PDF off-screen) | ✅ ativo — saneado Wave 1 (campos `contemplationMonth`/`analysisMonths` removidos) |
| `wealth:assumptions:preset:v1` | LS | `WealthAssumptionsContext` | mesmo provider | ✅ ativo |
| `active-strategy:v1` | LS | `ActiveStrategyContext` | Wealth ↔ Proposta | ✅ ativo |
| `nav:lastModule`, `nav:lastSubmodule` | LS | `src/utils/navState.ts` | `Index.tsx` (boot restore), sidebar/bottom-nav | ✅ ativo |
| `*:lastTab` (analysis/proposals/wallet/post-sale/proposal-pdf) | LS | `moduleTabPersistence.persistLastTab` | hooks `useRestoreLastTab`/`usePersistLastTab` | ✅ ativo |
| `*:force-default` | SS | `markForceDefault` (sidebar) | `consumeForceDefault` na entrada de módulo | ✅ ativo |
| `simulator-*` (input/result/contemplation) | LS | `SimulatorContext` | mesmo provider + reconciliação | ✅ ativo |
| `wave1:sanitized:v1` | LS | `runWave1Sanitize` | flag idempotente | ✅ infraestrutura |
| `wave2:sanitized:v1` | LS | `runWave2Sanitize` | flag idempotente | ✅ infraestrutura |
| `strategyV2:compareSelection:v1` | SS | (removido Wave 2) | — | ❌ removido — saneado em boot por `runWave2Sanitize` |
| `strategyV2` | LS | (removido Wave 2) | — | ❌ removido — flag/override do V2 extinto |
| `system_validation_logs` | LS | (removido Wave 1) | — | ❌ removido (viewer órfão excluído) |

LS = `localStorage` · SS = `sessionStorage`.

## Regras

1. **Single writer:** uma chave = um provider/módulo que escreve. Leituras
   externas devem usar o helper exportado pelo owner.
2. **Sem shadow state:** se uma chave persiste valores que também existem
   em runtime em outro provider, **deriva** (não duplica).
3. **Sanitize idempotente:** migrations em `src/utils/storage/wave*Sanitize.ts`
   com flag de versão (`wave{N}:sanitized:v{X}`).
4. **Documentar antes de criar:** nova chave entra primeiro nesta tabela.

## Histórico de ondas

- **Wave 1:** sanitização de `wealth:assumptions:v1` (strip `contemplationMonth`/`analysisMonths`) e remoção de `system_validation_logs` + viewer órfão.
- **Wave 2:** remoção arquitetural definitiva de `strategy-v2` (providers, telemetry, compare, feature flag, persistências `strategyV2*`). Snapshot histórico: `.lovable/audit/strategy-v2-removal-snapshot.md`.

## Próximas ondas (não fazer ainda)

- **Wave 3:** fix de `CAP_RATE` hardcoded em `strategyLibraryData.ts` (respeitar `ctx.rentalYield`).
- **Wave 4:** mover utils legacy para dentro de `@/core/finance` (resolver façade debt).
