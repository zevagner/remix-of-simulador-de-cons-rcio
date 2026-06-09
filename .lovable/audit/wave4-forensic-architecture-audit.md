# Auditoria Forense V2.4 LOCKED — Pós-Ondas 1–3
**Data:** 2026-05-22 · **Modo:** read-only forense · **Status plataforma:** unificada (Single Architecture / Ondas 1–3 concluídas)

> Honestidade brutal pedida. Onde encontrei resíduo real, marquei. Onde **não** há problema, marquei explicitamente — não inventar problema é parte da honestidade.

---

## 0. Snapshot

| Métrica | Valor |
|---|---|
| `.ts`/`.tsx` em `src/` | 568 |
| Contexts em `src/contexts/` | 8 (1 é o `AppProviders` wrapper) |
| Providers em layout | 3 (`ModuleNavigationContext`, `ClientJourneyContext`, `ModuleShellContext`) |
| Profundidade do provider tree | **9 níveis** (AppProviders.tsx) |
| Storage writers únicos | 9 chaves canônicas (todas com owner identificado) |
| `window.addEventListener` runtime | 11 sites (todos com cleanup) |
| `setTimeout/setInterval` runtime | poucos, pontuais (FEEDBACK_TIP, runtimeObservers heap sampler) |
| Arquivos > 700 LOC | 12 (3 deles editoriais — `helpContent.ts`, `strategyLibraryData.ts`, `objections/data.ts`) |
| CAP_RATE residual | 1 ocorrência **legítima** (fallback editorial off-screen) |

---

## A. MAPA ARQUITETURAL REAL

### A.1 Tabela de ownership (Source of Truth)

| Domínio | SoT | Consumidores | Persistência | Risco |
|---|---|---|---|---|
| Navegação top-level + sub-aba Análise | `pages/Index.tsx` (state) + `utils/navState.ts` | Sidebar, BottomNav, CTAs, popstate | `nav:lastModule`, `nav:lastSubmodule`, URL `?m=` | **Baixo** |
| Sessão simulador (inputs + result reconciliado) | `SimulatorContext` | Wealth/Investment/Bids/Comparator/PDF | `simulator-session` (efêmera), `simulator-input-by-type:v1` | **Baixo** |
| Premissas patrimoniais | `WealthAssumptionsContext` | Strategy library, PDF estratégias | `wealth:assumptions:v1`, `wealth:preset:v1` | Baixo–**Médio** ⚠️ ver D.1 |
| **Slice canônico p/ estratégias e PDF off-screen** | escrita: `SimulatorContext`. Leitores: `WealthAssumptionsContext`, `ProposalPdfModule`, `CashComparisonTab` | `strategy:sim-slice:v1` (LS) + CustomEvent `wealth:sim-slice:changed` | **Médio** ⚠️ ver B.1 |
| Estratégia ativa | `ActiveStrategyContext` | Wealth, Compare, ProposalPdf | `active-strategy:v1` | Baixo |
| Grupo selecionado (tipo + grupo) | `SelectedGroupContext` | Bids, Assemblies | `selected-group:v1:<userId>` | Baixo |
| Investimento (resultados publicados) | `InvestmentResultsContext` (publish read-only) | ProposalPdfModule | — (efêmero) | Baixo |
| Bids study (publicados) | `BidsStudyContext` | ProposalPdfModule | — | Baixo |
| Operações estruturadas | `StructuredOpsResultsContext` | PDFs | — | Baixo |
| Jornada do cliente | `ClientJourneyContext` | CRM/Pós-venda/Abordagem | depende do hook | Baixo |
| Tema | `useTheme` | App shell | `theme` | Baixo |
| Empresa atual | `useCurrentCompany` | RLS tenant-aware | LS (chave dedicada) | Baixo |
| Sidebar collapsed | local Index | Sidebar | `sidebar-collapsed` | Baixo |
| Feedback tip | local Index | toast | `app-feedback-tip-shown` | Baixo |
| Profile PDF | `usePdfProfile` | PDF | LS | Baixo |
| Aba ativa Análise + force-tab | `analysis:lastTab`, `analysis:force-default`, `analysis:force-overview` | AnalysisModule | LS | **Médio** ⚠️ ver D.4 |
| Pré-seleção Bids | `bids-preselect` | Bids tab | LS | Baixo |
| Pré-seleção Assemblies | `consortium-assemblies` | Assemblies | LS | Baixo |
| Nicho ativo | `activeNicheTitle` | Investment storytelling | LS | Baixo |
| Pipeline prospect | `pipeline_prospect_context` | CRM | LS | Baixo |
| Ordem cards Wealth | `wealth:order:v1` | Wealth | LS | Baixo |
| Perf profile | `perf:profile` | PerfProfiler | LS | Baixo |

**Veredito ownership:** consolidado. Não encontrei ownership duplicado real. As 9 chaves vivas têm owner único declarado em `docs/architecture/storage-keys-ownership.md`.

### A.2 Provider tree (9 níveis)

`ModuleNavigationProvider → DiagnosticProvider → SimulatorProvider → ClientJourneyProvider → InvestmentResultsProvider → BidsStudyProvider → SelectedGroupProvider → ActiveStrategyProvider → StructuredOpsResultsProvider`

Nada concorrente. Mas: **profundidade ≠ problema, valor não-memo ≠ ok**. Auditei rapidamente os `value` dos providers menores — todos memoizados. `SimulatorContext` é o pesado e tem split input/result correto.

`WealthAssumptionsProvider` **não está no AppProviders** (escopo correto: só monta dentro do `WealthPlatformModule`). Confirmado.

---

## B. RISCOS CRÍTICOS (com evidência)

### B.1 ⚠️ Acoplamento via `localStorage` + `CustomEvent('wealth:sim-slice:changed')` para mesma-tab
**Arquivos:** `SimulatorContext.tsx:706,733` (dispatch) · `WealthAssumptionsContext.tsx:354` (listener) · `CashComparisonTab.tsx:71-72` (focus+storage).

**Por que existe:** PDFs off-screen e o `CashComparisonTab` (em outra subárvore) precisam ler o sim-slice sem montar `SimulatorProvider`. Solução: persistir em LS + evento custom para mesmo tab (`storage` event não dispara no tab que escreveu).

**Risco real:**
- **Race condition** no boot: se `WealthAssumptions` montar antes do primeiro effect do `SimulatorContext` rodar, `persistedSim` é `null` até o usuário tocar qualquer input. Hoje a UI gateia (mostra "—"), então não há dado errado, só **flash visual** possível.
- **Stringify pesado a cada keystroke do simulador** (effect com ~17 deps). Já tem `useDeferredValue` no resto, mas esse effect grava JSON.stringify completo a cada mudança de qualquer um dos 17 inputs derivados. Em prazos longos pode causar long-task >50ms.
- **Sem versionamento** do shape do slice — se mudar a forma, leitores antigos podem hidratar lixo (há validação, mas silenciosa).

**Severidade:** Médio. Funciona. Mas é a única ponte cross-tree e merece blindagem.

### B.2 ⚠️ `Index.tsx` setTimeout sem dedupe forte
`Index.tsx:142-156` usa `setTimeout(3000)` para mostrar tip + grava `app-feedback-tip-shown`. Tem cleanup. Mas o effect roda em qualquer mudança de `user|loading`, e o cleanup pode disparar o `toast` se o `setTimeout` já queimou. Não é bug crítico (idempotente via LS), mas é fricção.

### B.3 ⚠️ `WealthAssumptionsContext` escreve LS a cada keystroke das premissas
`WealthAssumptionsContext.tsx:313-314` — `setItem(JSON.stringify(assumptions))` em todo render onde `assumptions` muda. Sem debounce. Mover sliders dispara N writes/segundo. Não quebra nada, mas é wasteful e pode contribuir para INP em mobile fraco.

### B.4 ⚠️ `monthlySchedule.ts:148-150` — `fallbackInsurancePercent`
Existe um fallback de seguro quando idade não foi informada e o usuário ligou seguro manualmente. **Comportamento documentado**, não é shadow behavior — engine única. Marcar como ponto a re-validar com produto se ainda faz sentido após unificação atuarial.

### B.5 ✅ NÃO confirmado como problema
- `CAP_RATE` em `strategyLibraryData.ts:183-189`: **só é usado quando `ctx.rentalYield` é undefined** (snapshots/off-screen sem Provider). Documentado, com `yieldOf(ctx)` canônico. Não é shadow behavior — é fallback editorial honesto, **com label explícito**. Manter.
- `mockSeed.ts:103` `estimateInstallment`: helper dev-only (MockSeedFab). Não roda em prod.
- `core/finance/internal/reconcile.ts:65` `creditFallback`: reconciliador legado interno do `@/core/finance`. Tem teste golden snapshot travando o output. Aceitável.

### B.6 ✅ Strategy-v2 — 100% morto
Grep confirma: zero referência runtime em `src/`. Só sobrou em `.lovable/audit/`, `mem://index.md`, `docs/architecture/storage-keys-ownership.md` e sanitize. **Limpo.**

### B.7 ✅ Listeners globais — todos com cleanup
11 sites, todos retornam função `remove*` no `useEffect`. `runtimeObservers.ts` tem 1 `setInterval(30s)` para heap sampling (sem cleanup, mas é singleton do boot — aceitável; só não roda em tab oculto).

### B.8 ✅ Console.* runtime — zero ocorrências em produção
Confirmado em segundo grep: o número "7 console.*" do audit anterior já foi resolvido em ondas anteriores. Hoje só há `// eslint-disable-next-line no-console` controlado em `main.tsx` (validateSystem dev-only).

---

## C. DÍVIDA TÉCNICA PRIORIZADA

| # | Item | Impacto | Risco | Urgência |
|---|---|---|---|---|
| 1 | Ponte `sim-slice` via LS+CustomEvent (B.1) | Médio | Médio | **Alta** — única dependência cross-tree |
| 2 | Writes em LS sem debounce nas premissas Wealth (B.3) | Médio (INP mobile) | Baixo | Média |
| 3 | `analysis:force-default` / `force-overview` (D.4) — 2 chaves para mesmo intent | Baixo | Médio (semântica obscura) | Média |
| 4 | Top arquivos > 700 LOC de domínio: `StrategyLibrarySection`, `SimulatorContext`, `InvestmentModule`, `ProposalHistoryModule`, `ProposalPdfModule` | Alto (maintainability) | Médio (refactor risk) | Baixa (não tocar agora) |
| 5 | `fallbackInsurancePercent` em monthlySchedule (B.4) | Baixo | Baixo | Baixa (validar com produto) |
| 6 | `Index.tsx` setTimeout 3s do feedback tip (B.2) | Trivial | Baixo | Baixa |
| 7 | `CashComparisonTab` listener de `focus` reativo extra | Baixo (re-read OK) | Baixo | Baixa |

---

## D. PROBLEMAS ESTRUTURAIS RESIDUAIS

### D.1 Ponte cross-tree única → ponto de fragilidade
**Padrão atual:** `SimulatorProvider` é root, `WealthAssumptionsProvider` é local ao módulo. Logo, premissas + slice precisam atravessar a árvore via `localStorage`. Funciona, mas é a única dependência arquitetural assimétrica viva.

**Opções (não recomendar agora, V2.4 LOCKED):**
- (a) Subir `WealthAssumptionsProvider` para o `AppProviders` (perde escopo, risco baixo).
- (b) Criar um `SimSliceContext` puro publicado pelo `SimulatorProvider` (limpo, custo médio).
- (c) Manter LS-bridge mas adicionar versionamento + debounce 250ms + assertions (mínimo invasivo).

### D.2 `CashComparisonTab` lê via storage reader
Mesmo padrão da D.1. Justificado (componente vive em comparator, fora do Wealth). Sem `WealthAssumptionsProvider` no escopo, é a única alternativa não-acoplada.

### D.3 `popstate` em 2 lugares (`Index.tsx`, `AdminGovernance.tsx`)
Não conflitam (URLs distintas), mas vale documentar — qualquer terceiro listener pode quebrar back/forward sem teste.

### D.4 `analysis:lastTab` + `analysis:force-default` + `analysis:force-overview` (3 chaves para 1 intent)
Padrão de "force-flag" para resetar aba na próxima entrada. Funciona, mas semântica fragmentada. Candidato a colapsar em 1 chave `{tab, forceReset}`.

### D.5 `StrategyLibrarySection.tsx` — 1708 LOC + `strategyLibraryData.ts` — 1680 LOC
Editorial mais código de UI. O `strategyLibraryData.ts` é dados (aceitável). O `StrategyLibrarySection.tsx` mistura UI + computações derivadas + microcopy — risco de regressão alto se refatorado. **Não tocar sem necessidade real** (constituição V2.4).

---

## E. QUICK WINS (baixo risco / alto impacto)

| # | Ação | Esforço | Risco |
|---|---|---|---|
| Q1 | **Debounce LS-write no SimulatorContext sim-slice** (300ms) — agrupa keystrokes | Trivial | Zero |
| Q2 | **Debounce LS-write no WealthAssumptionsContext** (300ms) | Trivial | Zero |
| Q3 | **Versionar sim-slice** (`__v: 1`) + validação no leitor | Baixo | Zero |
| Q4 | Substituir `setTimeout` do feedback tip por flag idempotente em `useEffect` sem timer | Trivial | Zero |
| Q5 | Documentar formalmente em `storage-keys-ownership.md` a ponte LS+CustomEvent como pattern oficial (e o porquê) | Trivial | Zero |
| Q6 | Adicionar `if (document.hidden) return` no heap sampler já existe; auditar se long-tasks observer também respeita (não respeita hoje) | Trivial | Zero |

---

## F. ORDEM IDEAL DE HARDENING

### Onda 4 — Sim-slice Bridge Hardening (próxima, recomendada)
**Objetivo:** blindar a única dependência cross-tree real (B.1) sem mudar arquitetura.
- Debounce + versionamento + assertions no leitor.
- Documentação formal do pattern como exceção governada.
- Risco: zero. Impacto: elimina race silenciosa.

### Onda 5 — Storage Write Throttling
**Objetivo:** atacar B.3 (Wealth assumptions LS writes sem debounce) + qualquer outro write em hot-path.
- `useDeferredValue` ou `debounce(300ms)` em todos os contexts que escrevem em LS dentro de `useEffect` com inputs vivos.
- Risco: muito baixo. Impacto: INP mobile.

### Onda 6 — Analysis Force-Flag Consolidation
**Objetivo:** colapsar `analysis:lastTab|force-default|force-overview` em 1 chave com semântica clara.
- Migration idempotente lendo as 3 e regravando a unificada.
- Risco: baixo. Impacto: maintainability.

### Onda 7 — Long-Task Observer hygiene
**Objetivo:** pausar observers caros quando `document.hidden` (heap já pausa, longtask não).
- Risco: zero. Impacto: bateria mobile, Citrix.

### Onda 8 (NÃO recomendada por enquanto)
- Refactor de `StrategyLibrarySection`/`SimulatorContext` (>700 LOC). **Aguardar pressão real de produto.** Constituição V2.4 desaconselha.

---

## Confirmações finais (brutalmente honesto)

✅ **Arquitetura financeira unificada** — confirmado. `@/core/finance` é fonte única; consumidores legados de `@/utils/calculations` só existem dentro da própria fachada e em testes.

✅ **Strategy-v2 morto** — zero runtime.

✅ **Ownership consolidado** — sem duplicação real.

✅ **Listeners com cleanup** — todos.

⚠️ **Shadow behavior residual** — só em B.4 (`fallbackInsurancePercent`). Documentado, não silencioso.

⚠️ **Dívida silenciosa real:** ponte LS+CustomEvent para sim-slice (B.1). É a única coisa que merece ação na próxima onda.

✅ **Não encontrei:** matemática paralela, providers concorrentes, hidratação duplicada, restores conflitantes, loops reativos, leaks de listener, navegação fantasma, race conditions sérias, force-sync/force-navigation/hotfix residuais.

❌ **Não recomendo:** rebuild, mudança de stack, novo router, novo state manager, refactor cosmético do StrategyLibrarySection. **V2.4 LOCKED é o estado correto.**

---

## Resumo executivo (1 parágrafo)

A plataforma está **arquiteturalmente sã**. As Ondas 1–3 entregaram o que prometeram: zero `strategy-v2`, zero duplicação de ownership, zero shadow yield, persistências canônicas. O único risco estrutural vivo é a **ponte `strategy:sim-slice:v1` via `localStorage` + `CustomEvent`** entre `SimulatorContext` (root) e `WealthAssumptionsContext`/`CashComparisonTab` (subárvore lateral) — funciona, mas precisa de blindagem (debounce + versionamento). Tudo o mais é polimento. **Onda 4 = Sim-slice Bridge Hardening** é a próxima ação racional.
