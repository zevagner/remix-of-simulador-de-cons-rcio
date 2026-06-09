# Foundation & Compatibility Layer Wave (U0)

**Wave:** strategic-presentation-architecture-unification — Wave U0
**Status:** Concluída — base estrutural pronta. Zero impacto visível em produção.
**Master plan:** `.lovable/audit/strategic-presentation-architecture-unification-masterplan.md`
**Princípio absoluto:** sem novo motor financeiro. Toda derivação numérica continua vindo de `@/core/finance` + `useInvestmentCalculations` + `usePatrimonialKpis`.

---

## 1. Entregas

| # | Entrega | Arquivo |
|---|---------|---------|
| 1 | Feature flag global + resolver com override (URL/localStorage) | `src/config/featureFlags.ts` |
| 2 | Contracts tipados (`StrategyBlueprint`, `StrategyPresentationData`, `KPIModel`, `ConsultiveContent`, `ComparePayload`, `CompareSelectionState`) | `src/components/modules/strategy-v2/contracts.ts` |
| 3 | Strategy blueprint centralizado (5 investment + 6 patrimonial) — single source of truth editorial | `src/components/modules/strategy-v2/blueprint.ts` |
| 4 | Compatibility layer / adapters (consumer-only do motor único) | `src/components/modules/strategy-v2/adapters.ts` |
| 5 | Executive Card SHELL (Layer 1) | `src/components/modules/strategy-v2/ExecutiveStrategyCard.tsx` |
| 6 | Consultive Panel SHELL (Layer 2 — Sheet drawer) | `src/components/modules/strategy-v2/ConsultiveStrategyPanel.tsx` |
| 7 | Compare Workspace SHELL (Layer 3 — KPI matrix) | `src/components/modules/strategy-v2/CompareWorkspace.tsx` |
| 8 | Barrel público | `src/components/modules/strategy-v2/index.ts` |
| 9 | Testes de fundação | `src/test/strategyPresentationV2Foundation.test.ts` |

---

## 2. Feature Flag

```ts
// src/config/featureFlags.ts
export const ENABLE_STRATEGY_PRESENTATION_V2 = false as const;
export function isStrategyPresentationV2Enabled(): boolean
```

- **Default:** `false` (zero impacto em produção).
- **Override em dev/QA:** `?strategyV2=1` (URL) ou `localStorage.strategyV2=1`.
- **Kill-switch:** alterar a constante para `true`/`false` sem migração reversa de estado — a UI atual continua sendo a única montada nesta wave.
- **Leitura única:** `isStrategyPresentationV2Enabled()` é o único ponto de checagem (a montante de qualquer render V2).

---

## 3. Strategy Blueprint — Single Source of Truth

11 estratégias canônicas consolidadas em `STRATEGY_BLUEPRINTS`:

| Source | IDs |
|--------|-----|
| `investment-scenario` (5) | `investment`, `traditional`, `sale`, `rental`, `quick-contemplation` |
| `patrimonial-archetype` (6) | `autoquitacao`, `escada-patrimonial`, `renda-passiva`, `construcao-inteligente`, `multiplicacao-ativos`, `holding-sucessao` |

Cada blueprint carrega:
- **Identity:** título, tag, ícone Lucide
- **Categoria comercial** (referencia / seguro / equilibrado / agressivo / estrategico)
- **kpiSet:** hero + secondary (KPIs canônicos)
- **ConsultiveContent (12 blocos pedagógicos):** `shortThesis`, `fullThesis`, `howItWorks`, `forWho`, `advantages`, `risks`, `pitch?`, `objections?`, `mistakes?`, `idealMoment?`, `examples?`, `disclaimer`
- **`editorialWeight`** (tie-breaker de ranking, NÃO é cálculo financeiro)

**Conteúdo migrado de:** `investment/investmentCopy.ts` (SCENARIO_TEXTS), `patrimonial/strategies.ts` (PATRIMONIAL_STRATEGIES), `InvestmentStorytelling.tsx` (tom institucional). Cobertura coberta por teste (`every blueprint carries the canonical consultive content`).

---

## 4. Compatibility Layer — Adapters

`src/components/modules/strategy-v2/adapters.ts` — duas funções consumer-only:

- `adaptInvestmentScenario(scenario: ScenarioResult, executiveKpis: ExecutiveKpiSet, rank, isRecommended): StrategyPresentationData | null`
- `adaptPatrimonialArchetype(blueprintId, kpis: PatrimonialKpis, rank, isRecommended): StrategyPresentationData | null`

**Garantias:**
- Sem `Math.pow`, sem fórmulas financeiras, sem leitura de schedule.
- Apenas formata strings e empacota valores recebidos.
- Recebe outputs prontos do motor único (`useInvestmentCalculations` → `deriveScenarioExecutiveKpis` → `ScenarioResult` + `ExecutiveKpiSet`; `usePatrimonialKpis` → `PatrimonialKpis`).
- `getBlueprint(id)` valida o `source`; retorna `null` se id não pertencer ao adapter — barreira contra cross-binding.

**Separação A/B do plano:**
- (A) **Dados financeiros** = vêm tipados de `ScenarioResult`/`ExecutiveKpiSet`/`PatrimonialKpis`.
- (B) **Dados consultivos** = vêm de `STRATEGY_BLUEPRINT_BY_ID[id].consultive`.

---

## 5. Shells (Layers 1 / 2 / 3)

Todas as shells consomem **apenas** `StrategyPresentationData` — não conhecem o motor.

- **`ExecutiveStrategyCard`** (Layer 1): header unificado (`StrategyCardHeader`), tese curta, hero KPI, grid 2-col de secundários, ações `Comparar` / `Ver detalhes →`. Visual mínimo deliberado.
- **`ConsultiveStrategyPanel`** (Layer 2): `Sheet` lateral com os 12 blocos pedagógicos derivados de `ConsultiveContent`. Disclaimer institucional preservado.
- **`CompareWorkspace`** (Layer 3): KPI matrix dinâmica (linhas = união ordenada dos KPIs presentes; colunas = estratégias selecionadas). Botão `remover` por coluna.

→ **Refinamento visual final** virá em U1/U2/U3. O objetivo desta wave é validar contratos.

---

## 6. UI reprocessando cálculos? — verificação

Já auditado no masterplan (§5): **zero ocorrências**. Esta wave **não introduz** cálculo em UI. Adapters formatam strings; shells leem campos. Resultado: a auditoria do masterplan permanece válida.

---

## 7. Coexistência

- Shells V2 vivem em diretório isolado `src/components/modules/strategy-v2/*` e **não são importadas** por `InvestmentModule` / `PatrimonialModule` nesta wave.
- Cards atuais (`InvestmentScenarioCard`, `PatrimonialStrategyCard`) seguem como única superfície renderizada.
- Quando ativarmos a flag (Wave U4/U5), o gating será no nível do módulo — antiga vs nova ambas já compatíveis com os mesmos contextos (`InvestmentResultsContext`, `usePatrimonialKpis`).

---

## 8. Preservação consultiva

✅ Conteúdo educacional **migrado, não removido**. O teste `every blueprint carries the canonical consultive content` impede regressão.

Mapping:
- `SCENARIO_TEXTS.title/why/how/risk` → `ConsultiveContent.{shortThesis, howItWorks, advantages, risks}`
- `PATRIMONIAL_STRATEGIES[*].thesis/bullets/forWho/disclaimer` → `ConsultiveContent.{shortThesis, howItWorks, forWho, disclaimer}`
- `InvestmentStorytelling` (IA) **continua intocada** no card atual; em U2 será chamada **dentro** do Layer 2 sem alteração de contrato.

---

## 9. Testes

`src/test/strategyPresentationV2Foundation.test.ts` cobre:
1. Flag default OFF + resolver correto.
2. Catálogo: 5 investment + 6 patrimonial, ids únicos, conteúdo pedagógico mínimo presente, lookup robusto.
3. Adapters: projeção verbatim de valores (sem cálculo), retorno `null` em cross-binding errado.

**Testes financeiros existentes:** intocados. `investmentCalculationsParity`, `kpiSignaturesRegression`, `patrimonialKpiSignatures`, `capitalPreservedKpiRelevance`, `installmentSingleSourceOfTruth`, `financingEngineParity` — todos seguem verdes (nada do que tocamos é importado por eles).

---

## 10. Performance

- Diretório isolado: shells **não entram** no bundle do `InvestmentModule` em produção (não são importadas).
- Adapters são funções puras; cálculos `useMemo`-friendly quando consumidos no futuro.
- Nenhum novo Provider/Context montado no boot.

---

## 11. Validações finais

| Item | Status |
|------|--------|
| Feature flag global criada e default OFF | ✅ |
| Compatibility layer presente | ✅ |
| Strategy blueprint centralizado | ✅ |
| Contracts tipados | ✅ |
| Executive card shell | ✅ |
| Consultive panel shell | ✅ |
| Compare workspace shell | ✅ |
| Single source of truth (blueprint + motor único via adapters) | ✅ |
| Coexistência arquitetura antiga ↔ nova | ✅ (V2 não montada) |
| Testes de fundação criados | ✅ |
| Testes financeiros existentes preservados | ✅ |
| Motor financeiro único preservado | ✅ |
| Conteúdo consultivo preservado | ✅ |
| Zero impacto perceptível para o usuário final | ✅ |

---

## 12. Próxima wave

**Wave U1 — Layer 1 (Executive Card behind flag):**
- Adapter de listagem (`useStrategyV2List`) que consome `useInvestmentScenarios` + `usePatrimonialKpis`.
- Renderizar `ExecutiveStrategyCard` em paralelo ao card antigo SOMENTE quando flag ON em dev.
- Snapshot de paridade: hero KPI do card V2 = KPI hero do card legado.

Aprovação humana necessária antes de prosseguir.
