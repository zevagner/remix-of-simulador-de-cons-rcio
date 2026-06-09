# Auditoria Técnica Definitiva — Código, Performance & Arquitetura

**Data:** 2026-05-12 · **Modo:** read-only (sem correções) · **Stack:** React 18 + Vite 5 + TS 5 + Tailwind v3 + Supabase
**Sinais de saúde imediatos:**
- 325/325 testes passando (29 suites, 14,5s) — incluindo paridade de motor mensal vs legado, golden snapshot do `SimulationResult`, parity de Investment/Financing engines.
- 468 arquivos `.ts/.tsx`, ~74k linhas. Top-5 maiores arquivos abaixo.
- 0 imports diretos de `@/utils/calculations*` fora da fachada (ESLint guard ativo em `error`).
- 0 `Math.pow` financeiro fora de `core/finance` (allowlist em vigor).
- Bundle: 39 deps de prod. SWC para React. **Sem `manualChunks`.**
- DB hot path: `profiles.idx_scan ≈ 53,5M` · `groups ≈ 10,1M` · `assembly_results ≈ 2,6M` · `user_roles ≈ 730k`.

---

## 1. Validação executiva (respostas diretas)

| Pergunta | Resposta |
|---|---|
| Existe UMA única engine financeira? | **Sim.** `src/core/finance` é a fachada única. Motor mensal (`calculateMonthlySchedule`) é fonte de verdade; `calculateSimulationLegacy` é orquestrador puro de primitivas (`installments/`); Prestamista usa engine operacional V1; Financing tem Price/SAC/CET canônicos; Investment tem `compoundGrowth`/`futureValueOfSeries`/`pricePmt` canônicos. |
| Existe drift matemático residual? | **Não em produção.** Tolerâncias `≤2%`/`≤1%`/`≤5%` documentadas e cobertas por parity tests. Snapshots golden travam `SimulationResult`. |
| Existe recomposição local residual? | **Não para parcela/seguro/IR/Price/SAC.** Apenas resíduos *cosméticos* tolerados (ex.: `formatCurrency` de derivados já calculados, totais em `structuredOpsConstants.calculateCardResult` que orquestra a engine canônica). |
| Simulador institucionalmente consistente? | **Sim.** `reconcileWithSchedule` força fonte única; gates de PDF aceitam dados parciais (`MissingDataNote`); fluxo bases vs estratégia separado. |
| Pronto para escala SaaS? | **Parcial.** Multi-tenant RLS sólido; falta code-splitting agressivo, paginação infinita em algumas listas, e instrumentação de métricas runtime (Web Vitals → Sentry). |
| Pronto para corporativo? | **Sim com ressalvas.** Auth + RLS + audit_logs + tenant isolation OK. Pendências: XSS pontual em `CommercialInsights`, AI cost guardrails, hot path em `profiles`. |

**Score consolidado: 8.4 / 10.**

---

## 2. Mapa arquitetural (alto nível)

```text
┌─────────────────── UI (React + Tailwind + shadcn) ───────────────────┐
│  pages/ (Index, Admin, Login, Shared, Landing)                      │
│  components/modules/{simulator, investment, comparator, bids,       │
│     assemblies, structured-ops, postSale, pipeline, community,      │
│     proposalPdf, diagnostic, objections, summary, analysis}         │
│  components/pdf/ (Pdf{Simulador,Analise,EstudoLances,...})          │
└──────────┬───────────────────────────────────────────────────────────┘
           │ consume only
┌──────────▼─── Estado / Contexts (16 contexts) ─────────────────────┐
│  SimulatorContext (793 LOC, 9 useEffects) — base vs strategy        │
│  DiagnosticContext / ClientJourneyContext                          │
│  InvestmentResultsContext / BidsStudyContext / SelectedGroupContext│
│  ModuleNavigationContext / ModuleShellContext                      │
│  proposal/ (façade canônica useProposalData)                       │
│  auth/theme/currentCompany                                         │
└──────────┬───────────────────────────────────────────────────────────┘
           │
┌──────────▼─── Hooks (29) + Services (20) + React Query (14) ───────┐
│  useInvestmentCalculations / useCashComparison / useAssemblies      │
│  usePostSaleQueries / useProposalsQueries / useAdminQueries         │
│  useCentralAI / useCopilotTriggers / useModuleCopilot               │
└──────────┬───────────────────────────────────────────────────────────┘
           │
┌──────────▼─── Core Finance (FACHADA ÚNICA — `@/core/finance`) ─────┐
│  internal/{monthlySchedule, calculations, reconcile}                │
│  installments/ (computeAdminFee/ReserveFund/Full/Reduced/Rediluted) │
│  financing/{price, sac, cet}                                        │
│  investment/ (compound, FV, price PMT, INCC)                        │
│  insurance/ + prestamista/ (operational table V1)                   │
└──────────┬───────────────────────────────────────────────────────────┘
           │
┌──────────▼─── Backend (Supabase / Lovable Cloud) ──────────────────┐
│  Tables: 23 (multi-tenant via company_id + RLS)                     │
│  Edge: 11 (sales-script, sales-copilot, generate-proposal,          │
│    investment-storytelling, niche-storytelling, module-copilot,     │
│    phase-action, sales-response, generate-pdf, share-proposal,      │
│    bid-recommendation, create/delete/update-user)                   │
│  Storage: PDFs em proposal_pdf_cache + bucket                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Achados — classificados por severidade

### 3.1 CRÍTICO

#### C-1 · XSS via `dangerouslySetInnerHTML` em conteúdo derivado de IA
- **Arquivo:** `src/components/modules/assemblies/CommercialInsights.tsx:174-177`.
- **Descrição:** Render de insights faz `line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')` e injeta com `dangerouslySetInnerHTML`. O escape feito (`"` → `&ldquo;`) **não cobre** `<`, `>`, `<script>`, `<img onerror>`, `javascript:` etc. Conteúdo vem de heurísticas locais hoje, mas o pipeline é alimentado por prompts/IA em fases adjacentes — qualquer string contendo `<` será renderizada como HTML.
- **Impacto:** XSS persistente se uma fonte de dados (assembly/grupo importado, futuro override IA) emitir HTML malicioso.
- **Severidade:** CRÍTICO · **Prioridade:** P0.
- **Causa raiz:** Implementação ad-hoc de "markdown bold" sem sanitização.
- **Reprodução:** Injetar `**<img src=x onerror=alert(1)>**` em qualquer campo cujo render passe pela função `renderLine` deste arquivo.
- **Solução ideal:** substituir por `react-markdown` (já presente nas deps) com plugins seguros, ou por um util `<Bold>` que tokeniza `**...**` retornando JSX (`<strong>` puro, sem HTML).
- **Solução incremental:** trocar pelo padrão `text.split(/\*\*(.*?)\*\*/).map((seg, i) => i % 2 ? <strong>{seg}</strong> : seg)`. Zero HTML injetado.
- **Risco da correção:** baixo (visual idêntico).

#### C-2 · `localStorage` como `auth.storage` + 27 usos espalhados sem namespace global
- **Arquivos:** `src/integrations/supabase/client.ts`, +27 arquivos com `localStorage.*`.
- **Descrição:** Sessão Supabase persiste em `localStorage`. Combinado com **27 hits diretos** no app (sem chave centralizada) há risco de colisão multi-app no mesmo domínio e dificulta limpeza segura no logout/troca de tenant.
- **Impacto:** Vazamento de estado entre contas no mesmo navegador (carteira, último cliente, simulador) após logout.
- **Severidade:** ALTO/CRÍTICO em ambiente compartilhado · **Prioridade:** P1.
- **Solução ideal:** wrapper `userScopedStorage(userId, key)` + limpeza no `signOut` / troca de tenant; documentar prefixos por feature.
- **Risco:** baixo/médio (precisa varredura).

### 3.2 ALTO

#### A-1 · Hot path em `profiles` (53,5M idx_scan) e `groups` (10,1M)
- **Causa provável:** `useAuth` resolve `profiles.user_id` em cada mount; `useCurrentCompany` faz join lógico repetido; `selectedGroupContext`/`useAssemblies` consultam `groups` com frequência. `analytics_events` insert em quase todo clique.
- **Impacto:** Custo I/O alto em escala SaaS, latência percebida em mobile.
- **Solução ideal:** cache `profiles+role+company` em `useAuth` por sessão (já existe `user_roles` dedupe via Set); `groups` via React Query com `staleTime` longo (5–15min). Bater no DB só sob invalidação de evento.
- **Prioridade:** P1.

#### A-2 · `SimulatorContext` com 793 LOC, 9 `useEffect` e múltiplos derivados
- **Risco:** dificulta auditoria, propenso a re-renders cascata. Já mitigado por split `useSimulatorInput()`/`useSimulatorResult()`, mas o provider unificado continua reexecutando 9 efeitos a cada update.
- **Solução incremental:** extrair efeitos relacionados a (a) reset de contemplação, (b) persistência em localStorage, (c) reconciliação com schedule, (d) telemetria, em hooks dedicados (`useContemplationSync`, `useSimulatorPersistence`, `useReconciliation`).
- **Prioridade:** P2.

#### A-3 · Ausência de `manualChunks` no Vite + 7 lazy modules apenas
- **Sintoma:** chunk principal carrega `recharts`, `framer-motion`, `intro.js`, `exceljs`, `react-markdown` num só burst; PDF e Admin não estão isolados.
- **Solução ideal:** `build.rollupOptions.output.manualChunks` segmentando `recharts`, `exceljs`, `intro.js`, `pdf-*`, `admin-*`. Lazy `AdminPage`, `SharedProposalPage`. Ganho potencial estimado: 30–45% no first-load do `/app`.
- **Prioridade:** P1 (UX corporativo).

#### A-4 · Telemetria de IA / runtime sem Web Vitals canônicos
- `@sentry/react` instalado, `lib/observability.ts` existe, mas não há instrumentação de **LCP/INP/CLS** nem de **token usage / cost per edge** em painel próprio. `aiResponseCache` cobre hit/miss mas não custo.
- **Prioridade:** P2.

### 3.3 MÉDIO

#### M-1 · `useEffect` ≥ 4 em 3 arquivos hot (`PostSaleModule`, `CommunityModule`, `BidsSimulationTab`)
- Risco moderado de fetch redundante; recomendar React Query com `enabled` por aba para evitar fetch antes do mount visual.

#### M-2 · `any` em 8 arquivos (8 hits máx em `BidsChart.tsx`, 7 em `PdfAnaliseFinanceira`)
- Tipagem fraca em pontos de chart/PDF: dificulta refactor seguro. Migrar para tipos de payload explícitos (Recharts payload, PDF row).

#### M-3 · Recharts sem `ResponsiveContainer` virtualization em listas longas
- `BidsSimulationTab` (714 LOC) e `CashComparisonTab` (589 LOC) renderizam tabelas mês-a-mês completas. `termMonths=240` × várias séries pode degradar mobile.
- **Solução:** `react-window` ou paginação por décadas; gráficos com `data` memoizado por ID estável.

#### M-4 · `CommunityModule` carrega tudo em uma página (664 LOC, 4 efeitos)
- Falta paginação infinita; `community_cases.idx_scan=551` ainda baixo, mas crescerá rapidamente.

#### M-5 · `proposal_pdf_cache` sem TTL / GC documentado
- Storage cresce indefinidamente. Sem job de limpeza por `generated_at < now()-90d`.

#### M-6 · Edge functions: 11 funções, mas só `aiResponseCache` é citado em 6 arquivos client. Servidor faz cache?
- Confirmar se `_shared/promptFragments` + `aiResponseCache` espelha cache server-side. Se cliente reinvoca em refresh sem cache, desperdiça tokens.

### 3.4 BAIXO

- **B-1 ·** 16 contexts ativos — alguns poderiam ser unificados (ex.: `ModuleNavigationContext` + `ModuleShellContext`).
- **B-2 ·** `console.log/warn/error` aparece só em `utils/logger` + `StructuredOperationsModule` (1 hit). Excelente higiene.
- **B-3 ·** `dependency` boundaries: `intro.js` (tour) e `framer-motion` poderiam virar `import()` sob demanda.
- **B-4 ·** `proposal_events`/`audit_logs` sem index visível em `(user_id, created_at desc)`. Validar plano de query no admin.
- **B-5 ·** `share_token` lido como query string em `/proposta?token=...` — confirmar `Referer-Policy: no-referrer` para evitar leak ao 3rd-party.

---

## 4. Mapa de risco (heatmap textual)

```text
                    Likelihood
                  Low  Med  High
Severity High   |     | A-3 | C-1 C-2 A-1
Severity Med    | M-5 | M-3 | A-2 A-4 M-1
Severity Low    | B-3 | B-1 | M-2 M-4 M-6
```

---

## 5. Mapa de performance

| Camada | Sinal | Veredicto |
|---|---|---|
| Boot inicial | Sem `manualChunks`, 7 lazy mods | **Médio** — A-3 |
| Hot paths DB | `profiles=53M`, `groups=10M`, `user_roles=730k` | **Alto** — A-1 |
| Renderização | `SimulatorContext` 793 LOC + 9 efeitos | **Médio** — A-2 |
| Tabelas mês-a-mês | Sem virtualization | **Médio** — M-3 |
| AI cost | Sem painel de custo/token | **Médio** — A-4 |
| Cache PDF | Sem GC | **Baixo** — M-5 |

---

## 6. Mapa financeiro (single source of truth)

| Domínio | Engine canônica | Consumers verificados | Drift |
|---|---|---|---|
| Parcela / Adm / FR / Reduced / Rediluted | `core/finance/installments` + `reconcile` | SimulatorContext, PdfSimulador, InstallmentCompositionTable, structured-ops | **0** |
| Schedule mensal | `core/finance/internal/monthlySchedule` | reconcile, useInvestmentCalculations, useCashComparison | **≤2%** documentado |
| Prestamista | `core/finance/prestamista` (Operational V1) | monthlySchedule, calculations, structuredOps, mipRates shim | **0** |
| Financing (Price/SAC/CET) | `core/finance/financing` | comparator FinancingComparisonTab, IA storytelling | **0** |
| Investment (compound/FV/PMT/INCC) | `core/finance/investment` | useInvestmentCalculations, InvestmentModule, PdfAnalise | **0** |
| Lances (Monte Carlo) | `utils/calculations/lances` (allowlisted) | BidsModule, BidAIRecommendation | n/a |
| IR | `utils/calculations/investimento` (allowlisted) | useInvestmentCalculations | n/a |

**Resíduos auditados:** `structuredOpsConstants.calculateCardResult` faz aritmética de orquestração (somar adm+FR+seguro/term) — **chama** a engine canônica para o seguro, então não recompõe. Aceitável.

---

## 7. Mapa IA

| Edge | Cache | Rate limit | Validador | Observação |
|---|---|---|---|---|
| sales-script | client + server | sim | Zod | OK |
| sales-copilot | hibrido | sim | Zod | gpt-5.2 |
| investment-storytelling | client | sim | Zod | OK |
| niche-storytelling | client | sim | Zod | OK |
| module-copilot | client | sim | Zod | OK |
| phase-action | tool-call | sim | Zod | OK |
| sales-response | n/a | sim | Zod | classifier |
| generate-proposal | n/a | sim | Zod | OK |
| generate-pdf | n/a | sim | Zod | Browserless |
| share-proposal | n/a | sim | Zod | OK |
| bid-recommendation | hibrido | sim | Zod | usa engine local |

**Pendências IA:** painel de custo por edge; verificação do `aiResponseCache` no servidor (ver M-6).

---

## 8. Plano de correção priorizado

```text
P0 (esta sprint)
 ├─ C-1: Sanitizar render de CommercialInsights (substituir innerHTML por JSX tokenizado)
 └─ Re-rodar suite + smoke test do módulo Assembleias

P1 (próxima sprint)
 ├─ A-3: Adicionar manualChunks (recharts/exceljs/intro.js/pdf/admin) + lazy AdminPage/SharedProposalPage
 ├─ A-1: useAuth com cache de profile+role+company por sessão; React Query staleTime ≥ 5min em useAssemblies
 └─ C-2: userScopedStorage + cleanup em signOut/changeTenant

P2 (mês)
 ├─ A-2: split de SimulatorContext em 4 hooks (contemplation/persistence/reconcile/telemetry)
 ├─ A-4: Web Vitals → Sentry + painel admin de cost/token por edge
 ├─ M-3: virtualization em tabelas mês-a-mês (react-window)
 └─ M-5: GC programado em proposal_pdf_cache (>90d)

P3 (trimestre)
 ├─ M-1/M-2/M-4/M-6 (tipagem, paginação infinita Community, server cache audit)
 └─ B-1..B-5
```

---

## 9. Scores (0–10)

| Eixo | Nota | Justificativa |
|---|---|---|
| Arquitetura | **9.0** | Façade única + Producer Contexts; 16 contexts justificados; lazy parcial. |
| Performance | **7.5** | Hot DB paths + falta de manualChunks + virtualization. |
| Segurança | **7.5** | RLS sólido, audit_logs, mas C-1 (XSS) e C-2 (storage) pendentes. |
| Multi-tenant | **9.0** | RLS revisado, `current_company_ids()` consistente, admin isolado em proposals. |
| Frontend | **8.5** | Tailwind tokens, SWC, design system robusto; 7 arquivos > 600 LOC. |
| Backend | **8.5** | Edges padronizados, Zod, rate limit, CSAA. |
| IA | **8.0** | Padronização CSAA + rate limit por user; falta cost panel. |
| Observabilidade | **7.0** | Sentry + admin AI panel; sem Web Vitals nem cost/token panel. |
| Governança | **9.0** | ESLint guards (Math.pow, prestamista, MIP labels); plano evolutivo documentado. |
| UX técnica | **8.0** | Tour, mobile FAB, semantic tokens; tabelas longas pendentes. |
| Engines financeiras | **9.5** | Drift zero; parity tests; golden snapshots; Operational Tables V1. |
| Maturidade SaaS | **8.0** | Falta cost panel, paginação infinita, code-splitting agressivo. |
| **Consolidado** | **8.4** | |

---

## 10. O que impede nota 10

1. **C-1 + C-2** (XSS pontual + sessão/storage) precisam ser resolvidos para passar revisão de segurança corporativa.
2. **A-3** (code-splitting) bloqueia métrica formal de **LCP < 2,5s** em mobile 4G.
3. **A-1** (hot path `profiles`) é incompatível com escala >1k contas ativas.
4. **A-4 / M-6** — sem painel de custo IA e GC de cache, escala vira risco financeiro.
5. **A-2 / M-3** — SimulatorContext + tabelas longas precisam de divisão e virtualization para mobile premium.

Resolvendo P0+P1+P2 acima → projeção de score **9.5/10**.

---

**Conclusão.** Plataforma demonstra maturidade institucional incomum: engine financeira unificada com drift zero, RLS multi-tenant consistente, IA padronizada CSAA, governança via ESLint e snapshots. Os bloqueios remanescentes são clássicos de plataforma SaaS em transição para escala enterprise: code-splitting, hot path DB, virtualization, observabilidade de custo/Web Vitals, e dois pontos de segurança pontuais (XSS markdown ad-hoc, storage scope). Nenhum risco financeiro/matemático ativo.
