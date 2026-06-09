---
name: Core Finance Façade
description: src/core/finance é a fachada única para cálculo financeiro; ESLint warn em Onda 0, error em Onda 5
type: constraint
---

## Regra
A partir da Onda 0, todo cálculo financeiro DEVE ser importado de `@/core/finance`. A fachada re-exporta os motores existentes em `src/utils/calculations/*` sem alterá-los.

## Estado por Onda
- **Onda 0** ✅ — fachada criada; ESLint `no-restricted-imports` em modo `warn`.
- **Onda 1** ✅ — motores movidos para `src/core/finance/internal/`; `utils/calculations*` viraram re-exports finos; fachada importa de `./internal/*`.
- **Onda 2 (atual)** 🚧 — governança reforçada (README proíbe internal; ESLint bloqueia `core/finance/internal/*` fora da fachada). Consumidores puros migrados: `utils/decisionEngine.ts`, `utils/proposalPdf/narrative.ts`, `services/createStorytelling.ts`, `services/proposals/proposalGenerator.ts`, `services/proposals/investmentProposalGenerator.ts`. 116/116 testes verdes.
- **Ondas 3–4** — migrar hooks (`useInvestmentCalculations`) e componentes (PDF, Simulator, Comparator, Investment, etc.).
- **Onda 5** — ESLint vira `error`; remover re-exports de compatibilidade em `utils/calculations*`.
- **Onda 6** — avaliar remoção de `legacyAggregate` se telemetria de divergência zerada por ≥30 dias.

## Proibido
- ❌ Reescrever `monthlySchedule.ts` ou qualquer motor.
- ❌ Adicionar lógica nova dentro de `core/finance/index.ts` — apenas re-exports.
- ❌ Migrar múltiplos módulos numa única onda (1 PR = 1 módulo).
- ❌ Remover código legado antes da Onda 6.
- ❌ Reduzir tolerância de divergência sem reanálise atuarial documentada.

## Símbolos públicos da fachada
- Motor mensal: `calculateMonthlySchedule`, `getInsuranceRate`, tipos `MonthlyScheduleInput/Result/Row`
- Reconciliação: `reconcileWithSchedule`, `getEffectiveClientCost`
- Legado (uso restrito): `calculateSimulation`, `calculateSimulationLegacy`, `deriveContemplationType`, `calculateFinancingCost`
- Investimento: `calculateIR`
- Lances: `analyzeBidHistory`, `estimateBidProbabilityMonteCarlo`
- Format: `formatCurrency`, `formatPercent`

**Why:** o sistema já tinha motor central (`monthlySchedule`), mas faltava enforcement. ~30 arquivos importavam `@/utils/calculations*` direto, sem rastreabilidade. Fachada + ESLint fecham o cerco sem reescrever nada.
