# Strategic Presentation Architecture — Unification Masterplan

**Wave:** strategic-presentation-architecture-unification
**Type:** Audit + Migration Plan (no code changes)
**Scope:** Investments + Patrimonial — unified consultative experience
**Critical invariant:** zero new financial engines, zero recalculation, zero loss of consultive content
**Owners:** Principal Architect / Principal UX Architect / Principal Auditor

---

## 0. Executive Summary

Os módulos **Investimentos** e **Engenharia Patrimonial** evoluíram para um produto consultivo de alta densidade — KPIs executivos, timelines, racionais consultivos, comparações, IA narrativa. O custo dessa evolução é **fadiga cognitiva**: cada card hoje tenta ser, simultaneamente, *resumo executivo + comparador + explicação + racional + relatório + simulador + KPI panel*.

Esta wave **não implementa**. Define a **arquitetura de apresentação em 3 camadas** (Executive Scan → Consultive Panel → Advanced Analysis), o **mapa de dependências** que precisa sobreviver à migração, e um **plano em waves pequenas** com gates de regressão em cada etapa. O motor financeiro único (`@/core/finance` + `useInvestmentCalculations` → `InvestmentResultsContext` → `usePatrimonialKpis`) é tratado como **invariante absoluto**: nenhuma wave pode introduzir cálculo paralelo.

---

## 1. Auditoria da Arquitetura Atual

### 1.1 Mapa de componentes (presentation surface)

```
ANALYSIS (tabs)
├── investment   → InvestmentModule.tsx               807 LOC
│   ├── ConsultiveBridge                              (shared)
│   ├── KpiEducationCard                              educação dos KPIs
│   ├── AIInsightsPanel (Collapsible)                 IA complementar
│   ├── RecommendationCard            (shared)        winner protagonista
│   ├── InvestmentScenarioCard × N    (cenários)      456 LOC ← HOTSPOT
│   │     ├── StrategyCardHeader      (shared)
│   │     ├── deriveScenarioExecutiveKpis             KPI hero+grid
│   │     ├── InvestmentStorytelling  (IA opcional)
│   │     ├── breakdown técnico (Settings2 disclosure)
│   │     └── Disclosures (racional / breakdown / IA)
│   ├── InvestmentSummaryCards
│   ├── ConsortiumDataCard            (Collapsible)
│   ├── InvestmentAssumptions         (Collapsible)
│   ├── StrategicNicheCards           (Collapsible)
│   ├── ScenarioComparisonChart       (compare)
│   ├── CashComparisonTab             (sub-tab)
│   └── InvestmentPdfActions / InvestmentPrintBlock
└── patrimonial → PatrimonialModule.tsx               106 LOC
    ├── ConsultiveBridge × 2          (entrada + retorno)
    ├── PatrimonialKpiBar
    ├── PatrimonialStrategyCard × 6   245 LOC          ← HOTSPOT
    │     ├── StrategyCardHeader      (shared)
    │     ├── KPI hero + chips        (PatrimonialKpis)
    │     ├── PatrimonialTimeline     (per archetype)
    │     └── Disclosure (racional consultivo)
    ├── PatrimonialDecisionDesk        226 LOC
    │     └── PatrimonialTimelineComparator
    └── PatrimonialJourneyStepper
```

### 1.2 Hooks / Providers / Engines

| Camada | Artefato | Papel | Observação |
|--------|----------|-------|------------|
| Engine | `@/core/finance` | Fonte única matemática | Fachada canônica (Onda B1/B2) |
| Engine | `useInvestmentCalculations` | Deriva paths 1-6 | **Único produtor** de cálculo de cenários |
| Engine | `useCashComparison` | Compara à vista vs consórcio | Reusa monthlySchedule |
| Engine | `calculatePatrimonialTimeline` (`core/finance/investment`) | Timeline por archetype | Determinístico |
| State  | `SimulatorContext` (input/result) | Premissas + schedule mensal | Fonte única do simulador |
| State  | `InvestmentResultsContext` | **Publica** outputs do InvestmentModule | Fonte única para PDF + Patrimonial |
| State  | `BidsStudyContext` | Resultados de lances | Análogo |
| Derive | `useInvestmentScenarios` | Monta `ScenarioResult[]` + classificações | Pure derivation, sem side-effect |
| Derive | `usePatrimonialKpis` | KPIs executivos consumindo InvestmentResults | **Consumer-only** ✓ |
| Derive | `deriveScenarioExecutiveKpis` | KPI set por cenário (ROI/TIR/Payback/Mult/Preserved) | Pure |

**Conclusão da auditoria de motor:** ✅ Já existe **single producer / multiple consumers**. Patrimonial não tem motor próprio — consome `InvestmentResultsContext`. Nenhum cálculo financeiro vive dentro de cards de UI.

### 1.3 Densidade atual por card (problema confirmado)

`InvestmentScenarioCard` (456 LOC) acumula em uma só superfície:

1. Header (icon + nome + tag)
2. Checkbox de seleção (compare mode)
3. Badge "Melhor"
4. Tese consultiva (silent rationale)
5. Hero KPI (Lucro estimado)
6. Grid 2-col com 4-5 KPIs executivos
7. Disclosure "Ver racional consultivo" → InvestmentStorytelling (IA narrativa)
8. Disclosure breakdown técnico (Settings2)
9. Disclaimer institucional
10. Estados: `isBest`, `isSelected`, `isExpanded` + callbacks

`PatrimonialStrategyCard` (245 LOC) acumula:

1. Header unificado
2. Tese consultiva
3. Hero KPI + 2-3 chips secundários
4. Timeline do archetype (PatrimonialTimeline)
5. Disclosure "Ver racional consultivo"

→ **Diagnóstico:** card é **hub-de-tudo**. Compare mode acontece *dentro* do card (checkbox embutido); aprendizado profundo (storytelling/timeline) acontece *dentro* do card (collapsible); KPIs executivos competem com a tese pela hierarquia.

---

## 2. Mapa de Dependências Críticas

> Tudo que **depende** dos cards atuais e precisa **sobreviver** à migração.

### 2.1 Estado / Seleção
- `selectedScenarios` (state local em `InvestmentModule`) → callback `onToggleSelect` no card → consumido por:
  - `InvestmentPdfActions` (gera PDF comparativo)
  - `handleGenerateInvestmentProposal` (proposta WhatsApp)
  - Barra de seleção (linha 699+)
- **Limite:** máx 3 cenários (regra de produto)
- `expandedCards: Set<string>` → controla disclosure por card individualmente

### 2.2 Compare mode (atual)
- **Mecanismo atual:** checkbox dentro de cada card (`InvestmentScenarioCard`) ↔ `selectedScenarios`
- **Visualização:** `ScenarioComparisonChart` (Recharts, 372 LOC) renderizada na barra inferior
- **Limitação:** comparação visual e gráfica **não está integrada** ao próprio scan dos cards

### 2.3 KPIs / derivações
- `deriveScenarioExecutiveKpis(scenario, calculations, assumptions)` é chamado **dentro** do card
- `usePatrimonialKpis()` retorna KPIs já derivados
- **Risco:** mover o card sem mover essa derivação → duplicação. Migração deve **preservar** `deriveScenarioExecutiveKpis` como pure function reutilizável

### 2.4 Analytics / Telemetria
- `trackEvent('investment_scenario_expanded', ...)` (no toggle do card)
- `trackEvent('investment_recommendation_cta', ...)`
- `trackEvent('ai_content_copied', ...)`
- IDs DOM consumidos por: `#investment-scenarios-grid`, `#investment-best-return-badge`, `#investment-summary-cards`, `#investment-assumptions`
  - **Quem consome:** Tour Guiado (deprecado, mas IDs ainda referenciados em testes), Help contextual, scroll programático
  - → **Preservar IDs** ou migrar com mapping

### 2.5 PDF / Print
- `InvestmentPdfActions` lê `scenarios` + `selectedScenarios` + `bestScenarioId` do módulo
- `InvestmentPrintBlock` renderiza versão print
- `ProposalPdfModule` lê `useInvestmentResults()` (contexto, não props)
- **Risco zero** se contexto continuar sendo a fonte única

### 2.6 Testes diretamente acoplados
- `src/test/kpiSignaturesRegression.test.ts` → assina KPIs por cenário
- `src/test/patrimonialKpiSignatures.test.ts`
- `src/test/capitalPreservedKpiRelevance.test.tsx` → renderiza `PatrimonialStrategyCard`
- `src/test/investmentCalculationsParity.test.ts` → snapshot dos paths
- `src/test/postContemplationChoiceCoherence.test.ts` (recém-adicionado)
- `AdminKpiMatrix.tsx` (admin) → ler signatures

### 2.7 IA / Storytelling
- `InvestmentStorytelling` (228 LOC) consome edge `investment-storytelling` por cenário
- Renderizado **dentro** do card no disclosure de racional
- **Tom institucional** + cache por sessão — preservar contrato

### 2.8 Disclosures globais (InvestmentModule)
- `KpiEducationCard` (educação dos KPIs)
- `AIInsightsPanel` (IA complementar)
- `ConsortiumDataCard` + `InvestmentAssumptions` (Settings2)
- `StrategicNicheCards` (Compass)
- → **Já estão fora dos cards.** Boa base; precisam apenas de re-hierarquização visual.

---

## 3. Mapa de Risco de Regressão

| Risco | Severidade | Probabilidade | Mitigação obrigatória |
|-------|------------|---------------|------------------------|
| **R1 — Quebra do contrato `InvestmentResultsContext`** | 🔴 Crítico | Baixa | Provider permanece intocado; só cards mudam |
| **R2 — Duplicação de derivação de KPI** | 🔴 Crítico | Média | `deriveScenarioExecutiveKpis` permanece a única fonte; novos componentes recebem `ExecutiveKpiSet` por prop |
| **R3 — Regressão financeira** | 🔴 Crítico | Baixa | Snapshots `investmentCalculationsParity` + `kpiSignaturesRegression` rodam em CI a cada wave |
| **R4 — Perda de seleção / compare** | 🟠 Alto | Média | Mover `selectedScenarios` para um `CompareScenariosContext` *antes* de quebrar cards |
| **R5 — Perda de aprendizado consultivo** | 🟠 Alto | Média | `InvestmentStorytelling` e blocos de racional virarem **Layer 2** dedicada — não removidos |
| **R6 — IDs DOM quebrados (analytics/help)** | 🟡 Médio | Alta | Manter IDs `#investment-scenarios-grid`, `#investment-summary-cards`, etc. mesmo após refatoração |
| **R7 — PDF / print quebrado** | 🟠 Alto | Baixa | `InvestmentPrintBlock` e `ProposalPdfModule` lêem do contexto — não dos cards |
| **R8 — Mobile regression** | 🟡 Médio | Média | Preservar grid responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) |
| **R9 — Re-renderização extra (perf)** | 🟡 Médio | Média | Novos contextos com seletores; manter `useMemo` em derivações |
| **R10 — Coexistência quebrada (feature flag drift)** | 🟠 Alto | Média | Feature flag por módulo, com kill-switch para rollback imediato |

---

## 4. Diagnóstico do Motor Financeiro Único

### 4.1 Status atual: ✅ Já é fonte única

```
SimulatorContext (input + monthlySchedule + result)
        │
        ▼
useInvestmentCalculations  ← ÚNICO PRODUTOR de paths 1-6
        │
        ├──► useInvestmentScenarios (deriva ScenarioResult[])
        │         │
        │         └──► deriveScenarioExecutiveKpis (pure)
        │
        ▼
InvestmentResultsContext.setResults({ calculations, scenarios, ... })
        │
        ├──► PatrimonialModule  → usePatrimonialKpis() (consumer-only)
        ├──► ProposalPdfModule  → useInvestmentResults()
        ├──► useProposalData()  (façade canônica)
        └──► (futuros consumidores)
```

### 4.2 Conformidade com regras institucionais
- ✅ Sem `Math.pow` financeiro fora de `core/finance/**` (ESLint enforced)
- ✅ Sem imports de `@/utils/calculations*` direto (ESLint warn)
- ✅ Patrimonial é consumer puro — zero motor próprio
- ✅ `usePatrimonialKpis` deriva de `InvestmentResults` + `SimulatorContext`, sem cálculos paralelos

### 4.3 Pontos de atenção
- `useInvestmentCalculations` (410 LOC) está estável mas **denso**; não é alvo desta wave (refator interno seria escopo separado)
- `calculatePatrimonialTimeline` vive em `core/finance/investment/patrimonialTimeline.ts` — é puro e determinístico
- **Nenhuma duplicação detectada**

→ **Conclusão:** o motor financeiro está saudável. A wave de presentation **não pode tocá-lo** e não precisa.

---

## 5. UI Reprocessando Cálculos? — Auditoria

| Componente | Lógica financeira embutida? | Veredito |
|------------|------------------------------|----------|
| `InvestmentScenarioCard` | Chama `deriveScenarioExecutiveKpis` (pure derivation, não cálculo de motor) + `getBreakdown` (apenas formatação de strings) | ✅ OK |
| `PatrimonialStrategyCard` | Apenas formatação de KPIs já derivados | ✅ OK |
| `RecommendationCard` | Recebe valores já calculados | ✅ OK |
| `ScenarioComparisonChart` | Apenas gráfico (Recharts) | ✅ OK |
| `InvestmentSummaryCards` | Apenas leitura | ✅ OK |
| `CashComparisonTab` | Usa `useCashComparison` (motor canônico) | ✅ OK |
| `PatrimonialTimeline` | Recebe pontos já calculados | ✅ OK |
| `PatrimonialKpiBar` | Recebe `kpis` derivados | ✅ OK |

**Veredito final:** zero UI faz cálculo financeiro. **Cumprimento da invariante institucional confirmado.**

---

## 6. Arquitetura Futura — 3 Camadas (Progressive Disclosure)

```
┌──────────────────────────────────────────────────────────────┐
│  LAYER 1 — EXECUTIVE STRATEGY CARD (scan, 30 segundos)       │
│  • Icon + nome + tag                                         │
│  • Tese curta (1 linha, silent rationale)                    │
│  • Hero KPI (1 número que importa)                           │
│  • 2 chips secundários (no máximo)                           │
│  • Ações: [Selecionar p/ comparar] [Ver detalhes →]          │
│  → CTA leva para Layer 2 / Layer 3                           │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼ (CTA "Ver detalhes")
┌──────────────────────────────────────────────────────────────┐
│  LAYER 2 — CONSULTIVE STRATEGY PANEL (aprendizado)           │
│  Drawer / Sheet ou rota dedicada (não Collapsible inline)    │
│  • Como funciona      • Para quem serve                      │
│  • Vantagens          • Riscos                               │
│  • Pitch consultivo   • Objeções comuns                      │
│  • Erros frequentes   • Momento ideal                        │
│  • Narrativa comercial (IA: InvestmentStorytelling)          │
│  → Conteúdo já existe, hoje espalhado entre disclosures.     │
│    Migra para superfície dedicada, sem perda.                │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼ (CTA "Análise profunda" ou Compare)
┌──────────────────────────────────────────────────────────────┐
│  LAYER 3 — ADVANCED ANALYSIS LAYER                           │
│  Workspace lateral / página focada                           │
│  • Compare mode multi-scenario (lado a lado, KPI matrix)     │
│  • Timelines comparáveis                                     │
│  • Premissas editáveis                                       │
│  • Gráficos profundos (ScenarioComparisonChart)              │
│  • Decision Desk (Patrimonial)                               │
│  • Breakdown técnico                                         │
└──────────────────────────────────────────────────────────────┘
```

### 6.1 Princípios da nova arquitetura
- **One responsibility per layer.** Card = scan; Panel = aprendizado; Workspace = análise.
- **Compare mode externo.** Sai de dentro do card; vira **workspace dedicado** (Layer 3) acionado por seleção persistida em `CompareScenariosContext`.
- **Single source of truth por estratégia.** Cada estratégia (investment scenario ou patrimonial archetype) tem **um único registro canônico** com: tese, KPIs, narrativa, timeline, comparações, ranking. Nada duplicado.
- **Preservação consultiva.** Toda explicação atual continua no produto — apenas migra de disclosure inline para Layer 2 dedicada.

### 6.2 Single Source of Truth — modelo conceitual

```
StrategyDescriptor (puro, sem React)
├── id
├── kind: 'investment' | 'patrimonial'
├── identity   { title, tag, icon, forWho }
├── thesis     { short, full }
├── kpis       { hero: KpiKind, secondary: KpiKind[] }
├── learning   { howItWorks, advantages, risks, pitch, objections, mistakes, idealMoment, examples }
└── timelineRef?: PatrimonialArchetype
```

Já existe esqueleto:
- `PATRIMONIAL_STRATEGIES[]` em `patrimonial/strategies.ts` (curado, parcial)
- `useInvestmentScenarios` (deriva runtime de cálculos)
- `SCENARIO_TEXTS` em `investmentCopy.ts` (parcial)

→ **Migração:** unificar essas três fontes em **um único catálogo `strategyCatalog.ts`** + um runtime KPI binder. Sem novo motor.

---

## 7. Comparação Moderna (Layer 3)

### 7.1 Modelo proposto (workspace, não dentro do card)

```
┌─ Compare Workspace ──────────────────────────────────────────┐
│  [🟦 Cenário A]  [🟦 Cenário B]  [🟦 Cenário C]  [+ Adicionar]│
│  ──────────────────────────────────────────────────────────  │
│  KPI Matrix (rows: KPIs canônicos, cols: cenários)           │
│  ──────────────────────────────────────────────────────────  │
│  Timeline overlay (3 séries)                                 │
│  ──────────────────────────────────────────────────────────  │
│  Decisão recomendada (RecommendationCard)                    │
│  Botões: [Salvar como proposta] [Gerar PDF comparativo]      │
└──────────────────────────────────────────────────────────────┘
```

- Acesso: **CTA fixo** "Comparar (n)" que aparece na lista de cards quando `selectedScenarios.length >= 2`
- Persistência: `CompareScenariosContext` (cross-module: investment + patrimonial)
- Limite: máx 3 (regra de produto preservada)

---

## 8. Plano de Migração — Waves Pequenas

> **Cada wave** é independente, com critério de saída e gate de regressão. Sem big bang.

### Wave U0 — Foundations (1 PR, baixo risco)
- Criar `CompareScenariosContext` (state + setSelected; ainda não plugado em UI)
- Criar `strategyCatalog.ts` (estrutura, **sem** ainda mover dados)
- Criar primitivos vazios:
  - `<ExecutiveStrategyCard />` (skeleton com props canônicas)
  - `<ConsultiveStrategyPanel />` (skeleton drawer)
  - `<CompareWorkspace />` (skeleton)
- Feature flag global `experience.unifiedV2 = false`
- **Gate:** zero diff visível em produção; lint + tests verdes

### Wave U1 — Layer 1 (Executive Card) [behind flag]
- Implementar `<ExecutiveStrategyCard />` consumindo `ScenarioResult` ou `PatrimonialStrategy`
- Renderizar **em paralelo** ao card antigo, sob flag
- Adapter: converte ambos os modelos atuais para `StrategyDescriptor`
- **Gate:** snapshot test do KPI hero idêntico ao card antigo; `kpiSignaturesRegression` verde

### Wave U2 — Layer 2 (Consultive Panel) [behind flag]
- Migrar `InvestmentStorytelling` + breakdown técnico + KPI education para `<ConsultiveStrategyPanel />`
- Drawer/Sheet ancorado pelo CTA "Ver detalhes" do Layer 1
- Conteúdo fonte: `strategyCatalog.learning` + `InvestmentStorytelling` (IA)
- **Gate:** zero perda de conteúdo (checklist consultivo: 12 blocos por estratégia); IA edge sem regressão

### Wave U3 — Layer 3 (Compare Workspace) [behind flag]
- Implementar workspace de comparação consumindo `CompareScenariosContext`
- Migrar `ScenarioComparisonChart` + KPI matrix + Decision Desk para a nova superfície
- CTA flutuante "Comparar (n)" sobe do bottom quando `selected.length >= 2`
- **Gate:** seleção persiste; PDF comparativo continua gerando (consumer do contexto, não dos cards)

### Wave U4 — Cutover Investments [flag → ON em staging]
- Trocar render do `InvestmentModule` para usar Layer 1 + 2 + 3 atrás da flag em staging
- QA mobile + desktop + print + PDF
- **Gate:** todos os testes (`investmentCalculationsParity`, `kpiSignaturesRegression`, `crossModuleConsistency`, `pdfConsistency`) verdes

### Wave U5 — Cutover Patrimonial [flag ON em staging]
- Mesma troca em `PatrimonialModule`
- `PatrimonialKpiBar` migra para Layer 1 (ou vira topo do workspace)
- `PatrimonialDecisionDesk` migra para Layer 3
- **Gate:** `patrimonialKpiSignatures` + `capitalPreservedKpiRelevance` verdes

### Wave U6 — Production rollout + cleanup
- Flag ON em produção após 7 dias em staging sem incidente
- Após mais 14 dias estáveis: **remover** componentes legados (`InvestmentScenarioCard`, `PatrimonialStrategyCard` antigo) e seus disclosures inline
- Atualizar memórias e docs

---

## 9. Estratégia de Compatibilidade

- **Feature flag única:** `experience.unifiedV2` (boolean, default OFF)
- **Adapter pattern:** `StrategyDescriptor` é o contrato canônico; tanto o sistema antigo quanto o novo lêem dele. Permite render lado a lado em dev.
- **Mesma fonte de KPI:** Layer 1/2/3 e cards antigos consomem **a mesma** `deriveScenarioExecutiveKpis` + `usePatrimonialKpis`. Drift impossível.
- **IDs DOM preservados:** mesmo após cutover, manter IDs (`#investment-scenarios-grid`, `#investment-summary-cards`, `#investment-assumptions`, `#investment-best-return-badge`) para analytics/help/scroll continuarem funcionando.
- **Kill switch:** `experience.unifiedV2 = false` reverte UI 100%, sem migração reversa de estado (estado de seleção é compatível em ambos).

---

## 10. Estratégia de Testes

| Categoria | Suíte | Wave de gate |
|-----------|-------|--------------|
| Regressão financeira | `investmentCalculationsParity`, `financingEngineParity`, `installmentSingleSourceOfTruth` | Toda wave |
| Regressão de KPI | `kpiSignaturesRegression`, `patrimonialKpiSignatures`, `capitalPreservedKpiRelevance` | U1, U5 |
| Regressão consultiva | **(novo)** `consultiveContentParity.test.ts` — para cada estratégia, verifica presença dos 12 blocos pedagógicos | U2 |
| Regressão de compare | **(novo)** `compareWorkspace.test.tsx` — seleção 2/3, KPI matrix, PDF | U3 |
| Regressão de disclosure | **(novo)** `disclosureMigration.test.tsx` — drawer abre, conteúdo presente, ESC fecha | U2 |
| Regressão mobile | Manual QA + Playwright opcional (viewport 375/768/1280) | U4, U5 |
| Regressão de seleção | `selectionPersistence.test.tsx` — context cross-module | U3 |
| Regressão visual | Snapshot dos 3 layers em viewport 1280×800 + 375×667 | U4, U5 |
| Cross-module | `crossModuleConsistency`, `pdfConsistency` | U4, U5 |
| Anti-XSS | CI gate `scripts/ci/anti-xss-gate.mjs` | Toda wave |
| Bundle gate | Verificar que Layer 2/3 entram em chunk lazy | U2, U3 |

---

## 11. Preservação do Motor Único — Contrato Absoluto

**Proibido nas waves U0–U6:**
- ❌ Recriar qualquer cálculo de path/cenário fora de `useInvestmentCalculations`
- ❌ Importar `Math.pow` para fórmula financeira fora de `core/finance/**`
- ❌ Criar derivação de KPI paralela a `deriveScenarioExecutiveKpis` ou `usePatrimonialKpis`
- ❌ Permitir que Layer 1/2/3 "calcule" — só **lêem** do contexto
- ❌ Duplicar `PatrimonialKpis` em estado local de componente

**Obrigatório:**
- ✅ Toda nova superfície consome `InvestmentResultsContext` / `usePatrimonialKpis`
- ✅ `StrategyDescriptor` é puro (sem hooks)
- ✅ `useMemo` em adapters para evitar re-render
- ✅ ESLint rule `no-restricted-imports` permanece bloqueando `@/utils/calculations*` direto

---

## 12. Aprendizado Consultivo — Estrutura Canônica (Layer 2)

Cada estratégia carrega **12 blocos pedagógicos** consolidados em `strategyCatalog`:

1. **Como funciona** (3 bullets máx, padrão Patrimonial)
2. **Para quem serve** (1 frase consultiva)
3. **Vantagens** (3-5 bullets)
4. **Riscos** (3-5 bullets, tom institucional, sem promessa)
5. **Pitch consultivo** (parágrafo curto)
6. **Objeções comuns** (lista Q&A: objeção → resposta)
7. **Erros frequentes** (lista: o que não fazer)
8. **Momento ideal** (perfil + timing)
9. **Narrativa comercial** (IA — `InvestmentStorytelling` ou `phase-action`)
10. **Comparação rápida vs. alternativas** (tabela 2-col)
11. **Exemplos práticos** (1-2 mini-cases redacionais)
12. **Disclaimer institucional** (já existe)

Conteúdo atual já cobre ~70% disso (espalhado entre `investmentCopy.ts`, `SCENARIO_TEXTS`, `PATRIMONIAL_STRATEGIES`, `InvestmentStorytelling`). Wave U2 **consolida** sem reescrever.

---

## 13. Aderência CAIXA — Preservação Visual

- Header unificado: continua `StrategyCardHeader` (já existe, gramática Patrimonial é a mestra)
- Cores: `--primary` (Azul Caixa), `--success`, `--muted` — **zero** cores custom
- Tipografia: hero KPI = `text-2xl font-semibold`; tese = `text-sm text-muted-foreground`
- Densidade: card antigo perde ~50% de altura; ritmo editorial premium preservado
- Disclaimers institucionais permanecem em todas as superfícies que mostram número
- IA mantém tom "estimativa, não garantia"

---

## 14. Performance

- Layer 2 e Layer 3 entram em **chunks lazy** (`React.lazy` + Suspense)
- Drawer (Layer 2): renderiza só quando aberto
- Workspace (Layer 3): rota separada ou Sheet — não pré-monta
- Adapters memoizados (`useMemo`)
- Seletores de contexto granulares para evitar re-render em cascata
- **Meta:** card scan com **menos** componentes que hoje → bundle do investment chunk **deve** cair (gate em U6)

---

## 15. Validação de Viabilidade

| Pergunta | Resposta |
|----------|----------|
| Motor financeiro pode ser preservado intocado? | ✅ Sim — já é fonte única; cards são consumers |
| `InvestmentResultsContext` continua válido? | ✅ Sim — contrato não muda |
| PDF + Print continuam funcionando? | ✅ Sim — lêem do contexto, não dos cards |
| Seleção/compare migra sem perder estado? | ✅ Sim — novo `CompareScenariosContext` herda shape |
| Conteúdo consultivo preservado? | ✅ Sim — Layer 2 consolida o que hoje vive em disclosures |
| Testes existentes continuam válidos? | ✅ Maioria sim — `capitalPreservedKpiRelevance` precisa renderizar Layer 1 ao invés de card antigo (atualização mecânica) |
| Aderência CAIXA mantida? | ✅ Sim — `StrategyCardHeader` já é o padrão mestre |
| Rollback em <5min é possível? | ✅ Sim — kill switch via flag |

→ **Veredito:** migração é **viável e segura**.

---

## 16. Risco Operacional — Síntese

**Aceitável:** tudo R3-R10 da seção 3 com mitigação aplicada.

**Bloqueador (parar wave):**
- Qualquer divergência em snapshots de motor financeiro → **rollback imediato**
- Quebra de `InvestmentResultsContext` → **rollback imediato**
- Perda de bloco pedagógico (auditoria por checklist em U2) → **wave volta**

**Plano B:** flag OFF reverte UI; nenhum dado ou contexto fica inconsistente (consumers continuam funcionando com cards antigos).

---

## 17. Entregas (esta wave — apenas planejamento)

- [x] Auditoria estrutural completa (§1)
- [x] Mapa de dependências (§2)
- [x] Mapa de regressão (§3)
- [x] Diagnóstico do motor financeiro (§4)
- [x] Diagnóstico de UI reprocessando cálculos (§5 — zero ocorrências)
- [x] Nova arquitetura proposta (§6)
- [x] Estratégia de progressive disclosure (§6)
- [x] Estratégia de comparação moderna (§7)
- [x] Plano de migração em waves (§8)
- [x] Estratégia de compatibilidade (§9)
- [x] Estratégia de testes (§10)
- [x] Estratégia de preservação do motor único (§11)
- [x] Estrutura canônica de aprendizado (§12)

**Próxima ação humana:** aprovar entrada na **Wave U0 — Foundations**. Nenhum código de UI é alterado nesta wave inicial; apenas contextos vazios e skeletons criados sob feature flag.

---

*Documento vivo. Atualizar a cada wave concluída em §8 com link para PR + relatório de gate.*
