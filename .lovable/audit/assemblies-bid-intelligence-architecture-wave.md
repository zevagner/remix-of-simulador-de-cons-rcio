# Assemblies + Bid Intelligence Architecture Audit Wave

**Status:** Audit-only (no code changes).
**Escopo:** Módulos `Assembleias` e `Estudo de Lances` — relação, fronteiras, drift e arquitetura ideal.
**Data:** 2026-05-13.

---

## TL;DR Executivo

Os dois módulos **não competem** no motor (a fonte canônica já existe), mas **competem na superfície** — ambos disputam o mesmo cliente mental ("o consultor que quer entender o grupo") e ambos misturam responsabilidades operacionais com consultivas:

- **Assembleias** hoje é **híbrido**: 70% data ops (upload Excel, pruning, CRUD por tipo) + 30% inteligência (BestGroupsForBid, CommercialInsights, ranking).
- **Estudo de Lances** hoje é **quase puro consultivo**, mas **lê dados brutos** via `useAssemblies` + recalcula via `analyzeBidHistory` sem nenhuma camada de "intelligence service" entre eles.
- **Atualização mensal** (Excel upload, deleção por mês/tipo, controle de retenção 18m) está exposta na superfície consultiva, **mesmo sendo restrita a admins via RLS**. Isso é drift institucional: usuário comum vê toolbar de import/limpar que não pode usar.

A arquitetura ideal separa em **3 camadas** com nomes institucionais novos:

```
[Admin/Governança] → Operações de Assembleias (ingestão, validação, retenção, auditoria)
        ↓ (publica)
[Data/Service Layer] → assemblies canônico + bidAnalysis (motor único)
        ↓ (consome)
[Consultivo] → Inteligência de Contemplação (ex-"Estudo de Lances", absorve BestGroups + CommercialInsights)
```

**Score consolidado atual:** 6.4/10 → **alvo pós-onda:** 9.2/10.

---

## FASE 1 — Auditoria Profunda

### 1. Módulo Assembleias — radiografia

| Dimensão | Estado real |
|---|---|
| **Entry point** | `AssembliesModule.tsx` (rota `assemblies`, sidebar passo 5 de Análise) |
| **Estado** | `AssembliesContext` (315 LOC) — selectedTab, selectedGroupNumber, stats, isFileImportOpen, handleFileImport |
| **Dados** | `useAssemblies()` → React Query → `fetchAssemblies()` → view `assemblies_normalized` (fallback legacy `assemblies`) |
| **Persistência** | `groups` + `assembly_results` (normalizado) + tabela legada `assemblies` (escrita dupla durante transição) |
| **Ingestão** | `ExcelFileImport` (340 LOC) — parse XLSX, dedupe, year-rollover, upsert via `upsertAssemblies` |
| **Retenção** | `MAX_MONTHS_TO_KEEP = 18` aplicado em `deleteAssembliesByMonths` durante import |
| **RLS** | `Approved users can read` / `Admins can insert/update/delete` — só admin escreve |
| **UX componentes** | Toolbar (import + limpar), 3 tabs (imob/auto/pesados), StatsCards, **BestGroupsForBid** (ranking), GroupSelector, GroupDetail, **CommercialInsights** (263 LOC, IA local) |
| **Observabilidade** | `useTrackModuleAccess('assemblies')`, alerta "Controle de histórico ativo" |
| **Print** | `PrintHeader` + `PrintableParams` + `PrintFooter` |

**Diagnóstico:** É um módulo de **2 personalidades** entregando 3 jobs:
1. **Admin job** — upload mensal, limpeza, retenção (visível ao admin via toolbar).
2. **Operational lookup** — "ver dados brutos do grupo X" (qualquer aprovado).
3. **Inteligência consultiva** — `BestGroupsForBid` + `CommercialInsights` (ranking + insights determinísticos sobre tendência/saúde).

Os jobs 1 e 3 deveriam estar em camadas opostas; estão na mesma tela.

### 2. Módulo Estudo de Lances — radiografia

| Dimensão | Estado real |
|---|---|
| **Entry point** | `BidsModule.tsx` |
| **Estado** | `BidsContext` (367 LOC) — `bidAnalysis`, `recommendation`, `clientBid`, `selectedGroup`, projeção |
| **Motor** | `analyzeBidHistory` em `src/utils/bidAnalysis/core.ts` (794 LOC) + `projection.ts` (365 LOC). Fachada oficial = `src/utils/bidAnalysis/index.ts`, reexportada por `src/utils/calculations/lances.ts` e por `@/core/finance` |
| **Dados** | **Mesmo `useAssemblies()`** — não há camada intermediária |
| **UX** | BidsProgressStepper (3 blocos narrativos), HeroInsight, GroupSelector, GroupInfo, ZonesCard, Chart (464 LOC), HistoryTable, BidAIRecommendation, SimulationTab (714 LOC) |
| **Publicação** | `BidsStudyContext` publica `BidsStudyResults` para o PDF — **fonte única confirmada** |
| **Edge** | `bid-recommendation` (IA opcional, complementar) |

**Diagnóstico:** Camada de **interpretação madura**. Único pecado: lê `assemblies` direto e roda `analyzeBidHistory` em cada `BidsContext` montado — sem cache compartilhado entre Lances, Cockpit, BestGroupsForBid, etc.

### 3. Fluxo end-to-end real

```text
Excel admin
   └─► ExcelFileImport (Assembleias UI)
        └─► upsertAssemblies → groups + assembly_results (+ legacy)
             └─► assemblies_normalized (view RLS)
                  └─► fetchAssemblies (service)
                       └─► useAssemblies (React Query, 5min stale)
                            ├─► AssembliesContext  ──► BestGroupsForBid (ranking determinístico)
                            │                        ──► CommercialInsights (IA local)
                            │                        ──► GroupDetail (lookup bruto)
                            ├─► BidsContext       ──► analyzeBidHistory (motor canônico)
                            │                        ──► UI Bids + BidsStudyContext → PDF
                            ├─► SimulatorModule   (lookup grupo p/ projeção)
                            ├─► PostSaleModule    (eventos por grupo)
                            └─► opportunityAnalysis (Carteira/scoring)
```

**Camadas misturadas:** ingestão e ranking convivem em `Assembleias`; interpretação convive em ambos via `BestGroupsForBid` (Assembleias) + `BidsZonesCard` (Lances) — duas leituras consultivas paralelas sobre os mesmos dados.

### 4. Boundaries atuais vs ideais

| Camada | Hoje vive em | Deveria viver em |
|---|---|---|
| Data ingestion (Excel, parse, dedupe) | Assembleias UI | **Admin → Operações de Dados** |
| Retention/pruning (18m) | Assembleias service | **Admin pipeline** (cron/edge ou batch admin) |
| CRUD bruto (delete by type/month) | Assembleias toolbar | **Admin → Governança** |
| Storage canônico | `groups` + `assembly_results` ✅ | mantém |
| Service layer | `services/assemblies.ts` ✅ | mantém |
| Engine (analyzeBidHistory + ranking) | `bidAnalysis/*` + `bestGroupsRanking.ts` | **Intelligence service único** (consolidar `bestGroupsRanking` em `bidAnalysis`) |
| Interpretação consultiva | Assembleias (BestGroups + Insights) **e** Lances (Zones, Hero, AI) | **Inteligência de Contemplação** (módulo único) |
| Lookup operacional bruto (grupo X) | Assembleias | **Drawer/modal dentro de Inteligência de Contemplação** ou Admin |

---

## FASE 2 — Sobreposição & Conflito

### 5. Responsabilidades duplicadas

| Item | Assembleias | Lances | Severidade |
|---|---|---|---|
| Leitura de `useAssemblies` direta | ✅ | ✅ | Médio (sem cache compartilhado de `analyzeBidHistory`) |
| Estatísticas por grupo (avg/min/max) | StatsCards + BestGroups | ZonesCard + HeroInsight | **Alto** — duas narrativas paralelas sobre o mesmo número |
| Ranking de "melhores grupos" | `BestGroupsForBid` | (ausente, mas é exatamente o que o consultor procura em Lances) | **Alto** — funcionalidade no lugar errado |
| Insights determinísticos | `CommercialInsights` (263 LOC) | `BidsHeroInsight` + `BidsZonesCard` | **Médio** — dois geradores de narrativa |
| GroupSelector | `AssembliesGroupSelector` | `BidsGroupSelector` | Baixo (já há `SelectedGroupContext` unificando seleção) |
| Print/PDF surfaces | `PrintHeader/Footer` | `PdfEstudoLances` | Baixo (canais distintos) |

### 6. Responsabilidades erradas

- **Toolbar de admin (Import Excel, Limpar tudo, Limpar tipo) na superfície consultiva.** Usuário comum vê botões inativos/restritos.
- **Alert "Controle de histórico ativo"** explica regra de pipeline na UI consultiva — informação institucional, deveria estar em Governança.
- **`BestGroupsForBid` em Assembleias** — é puramente consultivo; o consultor entra em "Assembleias" para encontrar isso, o que confirma que Lances **não é descoberto** como o lugar dessa pergunta.
- **`CommercialInsights` em Assembleias** — narrativa de IA local que pertence ao módulo de inteligência.

### 7. Drift arquitetural

- **Coupling vertical excessivo** Assembleias UI → Excel parser → Supabase upsert → React Query cache. Não há camada de "admin op" isolada.
- **Bypass de cache:** cada `BidsContext` recalcula `analyzeBidHistory` para o grupo selecionado; `BestGroupsForBid` recalcula para todos os grupos. Sem memoização cross-módulo.
- **Escrita dupla** `groups + assembly_results + assemblies (legacy)` durante transição — deveria ter prazo e remoção planejada na governança.
- **Tabela `assemblies` legada** ainda recebe writes; `assemblies_normalized` é a leitura. Drift de schema vivo.

---

## FASE 3 — Avaliação Estratégica

### 8. Assembleias é…

**Hoje:** módulo híbrido (admin ops + lookup + inteligência embutida).
**Deve ser:** **camada operacional administrativa** — invisível ao consultor; visível só para admin/governança como "Operações de Assembleias".

### 9. Estudo de Lances é…

**Hoje:** camada consultiva + analytics + estratégia.
**Deve ser:** **"Inteligência de Contemplação"** — único ponto de entrada do consultor para qualquer pergunta sobre grupos, tendência, lance e contemplação. Absorve BestGroups e CommercialInsights.

### 10. Divisão ideal

**Fusão parcial assimétrica:**
- Inteligência consultiva de Assembleias → migra para Lances (renomeado).
- Operações administrativas de Assembleias → migram para Admin/Governança.
- Data + service layer permanece compartilhado e canônico.
- Resultado: **2 superfícies, 1 motor, 1 pipeline**.

---

## FASE 4 — Admin & Governança

### 11. Migração para Admin — recomendado ✅

Deve migrar para `Admin → Operações de Assembleias`:
- Upload Excel mensal
- Validação de planilha (dedupe, year-rollover, formato)
- Histórico bruto navegável (tabela paginada)
- Retenção 18m configurável
- Auditoria de imports (quem importou, quando, quantas linhas, deltas)
- Limpar por tipo/mês

Deve permanecer no consultivo:
- Nada de CRUD. Zero.

### 12. Pipeline operacional ideal

```
1. Ingestão        → Edge function ou tela admin com parser server-side (mover do client)
2. Validação       → Schema Zod + checagem de duplicatas com diff visual
3. Versionamento   → audit_logs entry por import (entity='assemblies_import', metadata={count, months, deltas})
4. Retenção        → job admin com preview "vou apagar X meses"
5. Consistência    → checagem cross-tenant (assemblies são globais por design — confirmar e documentar)
6. Observabilidade → métrica em runtimeMetrics: ingestion_duration, rows_upserted, rows_pruned
```

### 13. Governança

- **Fonte canônica de leitura:** `assemblies_normalized` (view RLS-safe).
- **Fonte canônica de escrita:** `groups + assembly_results` — **deprecar `assemblies` legacy** com prazo (registrar em `mem://`).
- **Anti-drift:** ESLint rule proibindo import direto de `services/assemblies.ts` fora de `useAssemblies` e Admin.
- **Auditoria:** entry em `audit_logs` por import e por delete de retenção.
- Documentar em `docs/governance/assemblies-pipeline-policy.md`.

---

## FASE 5 — UX & Inteligência

### 14. UX consultiva

Quem deve interpretar/contextualizar/sugerir:
**Inteligência de Contemplação** (ex-Lances) — sozinha. O consultor não deve precisar trocar de módulo para entender um grupo.

### 15. Superfície ideal

- Consultor **não** deveria ver "Assembleias" na sidebar de Análise.
- Sidebar passo 5 → renomear para **"Inteligência de Contemplação"** (absorve Lances + BestGroups + CommercialInsights).
- "Assembleias" passa a existir só em `Admin → Dados Operacionais → Assembleias`.

### 16. Discoverability

- Pergunta natural do consultor: *"qual grupo é melhor para meu cliente dar lance?"* → hoje a resposta está em **Assembleias** (BestGroupsForBid), o que é antiintuitivo.
- Pós-fusão: a resposta vive em Inteligência de Contemplação, com "Lookup de grupo" como drawer secundário.

---

## FASE 6 — Integração Sistêmica

### 17. Consumidores atuais de `useAssemblies` / `analyzeBidHistory`

| Consumidor | Lê | Risco |
|---|---|---|
| `AssembliesModule` | useAssemblies | migra para Admin |
| `BidsModule` | useAssemblies + analyzeBidHistory | mantém, vira único consumidor consultivo |
| `SimulatorModule` | useAssemblies (group lookup p/ projeção) | manter — usa data layer canônico |
| `PostSaleModule` | useAssemblies | manter |
| `opportunityAnalysis` (Carteira) | useAssemblies | manter |
| `bidAnalysis/projection` | analyzeBidHistory | interno do motor |
| `PdfEstudoLances` | BidsStudyContext (já publicado) ✅ | manter |
| `BidsZonesCard`, `BidsHeroInsight`, `BidsGroupInfo`, `BidsHistoryTable`, `BidsChart`, `BidsSimulationTab` | BidsContext | mantém |

### 18. Fonte canônica

- **Dados:** `assemblies_normalized` (read) + `groups/assembly_results` (write). ✅
- **Inteligência:** `bidAnalysis` (engine) + `BidsContext` (estado) + `BidsStudyContext` (publicação para PDF). ✅
- **Pendência:** `bestGroupsRanking.ts` é uma "ilha" — deveria ser exportado por `bidAnalysis` para virar parte do motor único.

### 19. Inteligência paralela detectada

- `bestGroupsRanking.ts` calcula tendência e ranking **fora** de `bidAnalysis` ⇒ promover para `bidAnalysis/ranking.ts` e expor pela fachada.
- `CommercialInsights.tsx` gera narrativa local sobre os mesmos sinais que `BidsHeroInsight` ⇒ unificar em um único `bidNarrative.ts`.

---

## FASE 7 — Arquitetura Futura

### 20. Arquitetura ideal

```text
┌──────────────────────────────────────────────────────────────┐
│ ADMIN / GOVERNANÇA                                           │
│  • Operações de Assembleias (upload, validação, retenção)    │
│  • Audit log + métricas de ingestão                          │
│  • Deprecação controlada de assemblies legacy                │
└────────────┬─────────────────────────────────────────────────┘
             │ writes
             ▼
┌──────────────────────────────────────────────────────────────┐
│ DATA LAYER (canônico)                                        │
│  groups + assembly_results  ──►  assemblies_normalized (RLS) │
└────────────┬─────────────────────────────────────────────────┘
             │ fetchAssemblies (single)
             ▼
┌──────────────────────────────────────────────────────────────┐
│ SERVICE / HOOKS                                              │
│  useAssemblies (React Query, 5min)                           │
│  useBidAnalysisCached(group) ← novo, memoiza por groupNumber │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ INTELLIGENCE LAYER                                           │
│  bidAnalysis/                                                │
│    ├── core.ts        (analyzeBidHistory)                    │
│    ├── projection.ts  (cenários mês-a-mês)                   │
│    ├── ranking.ts     (← absorve bestGroupsRanking)          │
│    └── narrative.ts   (← absorve CommercialInsights logic)   │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ CONSULTIVE UX  →  "Inteligência de Contemplação"             │
│  • BidsProgressStepper (3 blocos)                            │
│  • Hero + Zones + Chart + History (atual)                    │
│  • BestGroups (absorvido)                                    │
│  • CommercialInsights (absorvido)                            │
│  • Lookup de grupo (drawer)                                  │
│  • Publicação canônica → BidsStudyContext → PDF              │
└──────────────────────────────────────────────────────────────┘
                Outros consumidores: Simulator, PostSale,
                Carteira (opportunityAnalysis), Cockpit,
                Comunidade — todos via data layer e/ou
                intelligence layer, nunca via Assembleias UI.
```

### 21. Responsabilidades

| Quem | Faz |
|---|---|
| Admin | Atualiza, valida, audita, retém |
| Data layer | Persiste e expõe canonicamente |
| Intelligence | Calcula tendência, ranking, recomendação, narrativa |
| Consultive UX | Apresenta, contextualiza, ensina, publica para PDF |
| Outros módulos | Consomem via data + intelligence; nunca tocam admin |

### 22. Nomenclatura

| Hoje | Ideal |
|---|---|
| Sidebar "Assembleias" (consultor) | **remover** da Análise |
| Sidebar "Estudo de Lances" | **"Inteligência de Contemplação"** |
| Admin "—" (não existe) | **"Operações de Assembleias"** |
| Eng. interno "bidAnalysis" | manter (já é canônico) |

---

## FASE 8 — Auditoria Final

### 23. Respostas diretas

| Pergunta | Resposta |
|---|---|
| Competem ou se complementam? | Hoje **competem na superfície**, complementam no motor. Pós-fusão: complementares puros. |
| Mistura inadequada? | **Sim** — admin ops + inteligência consultiva no mesmo módulo. |
| Atualização mensal deve ir para Admin? | **Sim, com alta prioridade.** |
| Arquitetura canônica clara? | Parcial — data layer ✅, engine ✅, UX ❌ (split errado). |
| Drift estrutural? | **Sim:** legacy `assemblies`, `bestGroupsRanking` ilha, dois geradores de narrativa. |
| Consultor entende intuitivamente? | **Não** — busca "melhores grupos" em "Assembleias", não em "Lances". |
| Arquitetura ideal? | 3 camadas com Admin separado, motor único, UX consultiva única (ver §20). |
| O que impede 10/10? | Toolbar admin no consultivo, ranking no lugar errado, narrativa duplicada, legacy table viva, sem cache cross-módulo de `analyzeBidHistory`. |

### 24. Scores

| Dimensão | Atual | Alvo pós-onda |
|---|---:|---:|
| Architectural clarity | 6.0 | 9.3 |
| Operational governance | 5.5 | 9.5 |
| Intelligence maturity | 8.0 | 9.4 |
| Consultive UX | 5.5 | 9.2 |
| Modular separation | 5.0 | 9.3 |
| Platform coherence | 6.5 | 9.0 |
| **Consolidado** | **6.4** | **9.2** |

---

## Roadmap recomendado (próximas ondas)

**Onda 1 — Boundary Hard Split (sem quebrar nada)**
- Mover toolbar de import/limpar para `Admin → Operações de Assembleias` (nova aba).
- Esconder `AssembliesToolbar` para não-admins (já é noop, mas limpa UI).
- Mover alert "Controle de histórico" para Governança.

**Onda 2 — Inteligência Unificada**
- Promover `bestGroupsRanking.ts` para `src/utils/bidAnalysis/ranking.ts`; reexportar.
- Mover `BestGroupsForBid` e `CommercialInsights` para `BidsModule` (nova seção "Melhores grupos").
- Memoizar `analyzeBidHistory` por (groupNumber, dataVersion) num hook compartilhado.

**Onda 3 — Renomeação & Sidebar**
- Renomear "Estudo de Lances" → "Inteligência de Contemplação".
- Remover "Assembleias" da sidebar de Análise; manter rota viva (deep links + PDF) com redirect informativo.
- Atualizar `mem://` (sidebar-fluxo-linear-6-passos, selected-group-context, bids-study-context).

**Onda 4 — Pipeline Admin**
- Edge function `assemblies-import` (server-side parse + validação + audit_log).
- Tela admin com histórico de imports, diff por mês, ação de pruning com preview.
- Deprecar escrita em `assemblies` legacy (manter leitura por 1 release, depois drop).

**Onda 5 — Governance & Anti-drift**
- ESLint rule: `services/assemblies` só pode ser importado por `useAssemblies` e por `src/components/admin/**`.
- Política `docs/governance/assemblies-pipeline-policy.md`.
- Métricas em `runtimeMetrics`: ingestion_duration, rows_upserted, retention_pruned.

---

## Anexo A — Inventário de arquivos por camada

**Data layer (manter):** `src/services/assemblies.ts`, `src/hooks/useAssemblies.ts`, `src/types/consortium.ts`, `src/utils/assemblyData.ts`.
**Engine (consolidar):** `src/utils/bidAnalysis/{core,projection,index}.ts`, `src/components/modules/assemblies/bestGroupsRanking.ts` → migrar.
**UI Assembleias (split):** `AssembliesModule`, `AssembliesContext`, `AssembliesToolbar`, `ExcelFileImport`, `AssembliesContent` → Admin. `BestGroupsForBid`, `CommercialInsights` → Bids.
**UI Lances (manter + expandir):** todos os arquivos em `src/components/modules/bids/**`.
**Publicação canônica (manter):** `src/contexts/BidsStudyContext.tsx`, `src/contexts/SelectedGroupContext.tsx`.

## Anexo B — Riscos da reorganização

- **PDF/Estudo de Lances:** já consome via `BidsStudyContext` — risco zero.
- **Simulator/PostSale/Carteira:** consomem via `useAssemblies` puro — risco zero.
- **Deep links salvos para `/assemblies`:** manter rota com redirect 30 dias.
- **Print mode de Assembleias:** mover header/footer para a tela admin.
- **Seletor de grupo:** já unificado por `SelectedGroupContext` — risco zero.
