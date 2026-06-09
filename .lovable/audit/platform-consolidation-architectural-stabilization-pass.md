# Platform Consolidation & Architectural Stabilization Pass

**Wave:** Consolidation & Stabilization · 2026-05-18
**Modo:** auditoria executiva + cleanup mínimo de risco zero
**Princípio absoluto:** consolidar > expandir. Toda mudança nesta wave é reversível, sem novas features, sem novos engines, sem novos providers, sem novas abstrações.

Origem: `.lovable/audit/master-definitive-enterprise-platform-audit.md` (score 6.5/10, riscos C1–C8, recomendação de feature freeze por 2 waves).

---

## 1. Critical Risk Collapse Pass

Mapa C1–C8 → estado atual → ação desta wave (cleanup) → ação **planejada** (próxima wave dedicada, fora do feature freeze).

| Risco | Tema | Estado | Ação nesta wave | Próxima wave dedicada |
|---|---|---|---|---|
| **C1** | Provider Lasagna (Index.tsx, 8 níveis) | Confirmado | **Documentar** ordem e ownership (§2). Nenhum provider tocado para não introduzir regressão em escrita/leitura cruzada. | Extrair `<AppProviders>` único agrupando contexts de domínio (Simulator/Investment/Bids/Selected/Wealth/Active/StructuredOps); manter ordem topológica auditada. |
| **C2** | God-Context `SimulatorContext` (776 LOC, 25 hooks) | Já splittado em input/result + reconcile canônico (memo `simulator-base-vs-strategy`, `simulator-context-split-real`) | Nenhuma mudança — split real já existe; apenas reforço de governança (§4). | Mover reconciliação para selector puro testável; reduzir LOC do provider concentrando lógica em `@/core/finance`. |
| **C3** | Drift legado vs motor mensal (≤5% idade≥45/prazo≥200) | Tolerâncias documentadas e travadas por teste | Nenhuma mudança — drift é intencional (seguro atuarial), governado por memo `divergencia-motores-tolerancias`. | Onda dedicada de paridade só se evidência operacional surgir; não abrir sem trigger real. |
| **C4** | Regras hardcoded (240/200) | Resolvido em wave anterior (`canonical-term-limit-correction-pass.md`); `consortiumRates.ts` é fonte única; ESLint warn em call sites diretos | Nenhuma mudança | Promover warn → error em `@/utils/calculations*` (Onda 5 do roadmap finance). |
| **C5** | Adaptive Suggestion sub-utilizado | Ativado em 3 de 8 candidatos (`guided-advisory-activation-continuity-pass.md`) + rationale (`explainable-consultive-guidance-pass.md`) | Nenhuma mudança — cobertura adicional fica fora do freeze. | Reavaliar após telemetria mínima de dismissal/conversion. |
| **C6** | Prompt drift em 9 edges | Mitigado por `_shared-edges/promptFragments.ts` + `scripts/sync-shared-edges.sh` + `aiInvariants.test.ts` | Nenhuma mudança | CI gate bloqueando diff entre `scripts/_shared-edges/` e `supabase/functions/*/_lib/`. |
| **C7** | Trust artifacts (SOC2/DPA/Status Page) | TrustCenter ativo; subprocessors em governance; lifecycle hardening wave2 entregue | Nenhuma mudança | Página `/confianca` ganhar feed Status Page externo + download DPA versionado; fora do escopo desta wave. |
| **C8** | Bundle peso (helpContent, strategyLibraryData) | Manual chunks ativos; ambos ainda em main por serem importados sincronamente em registries | Nenhuma mudança | Lazy split por área (help/strategy) com guarded import + CI bundle size gate (pendente em `bundle-policy.md`). |

**Resultado:** zero risco crítico tocado por código nesta wave. Todos os C-risks têm dono explícito e plano de wave dedicada **fora do feature freeze**, o que é o comportamento correto durante estabilização.

---

## 2. Provider & Context Consolidation

### Inventário atual (`src/contexts/` + providers em `src/pages/Index.tsx`)

| Context | Domínio | Producer | Consumers principais | Ownership |
|---|---|---|---|---|
| `SimulatorContext` (input/result split) | Simulação canônica | `SimulatorModule` | Investment, Comparator, Bids, Proposal, PDF, Wealth | **Canonical**: `@/core/finance` |
| `DiagnosticContext` | Perfil cliente | `DiagnosticModule` | Strategy, Proposal, PDF, AdaptiveProfile | **Canonical**: Diagnostic |
| `ClientJourneyContext` | Etapa CRM | `ProposalHistory`, `CarteiraModule` | CentralAI, SalesScript, AdaptiveProfile | **Canonical**: Journey |
| `InvestmentResultsContext` | Outputs cenários | `InvestmentModule` | PDF, Proposal, AdaptiveProfile | **Canonical**: Investment |
| `BidsStudyContext` | Análise lances | `BidsModule` | PDF, AdaptiveProfile | **Canonical**: Bids |
| `SelectedGroupContext` | tipo+grupo | `BidsModule` ↔ `AssembliesModule` | Bids, Assemblies, PDF | **Canonical**: Selected |
| `StructuredOpsResultsContext` | Op. Estruturadas | `StructuredOperationsModule` | PDF | **Canonical**: StructuredOps |
| `WealthAssumptionsContext` | Premissas Wealth | `WealthPlatformModule` (scoped) | Proposal (via `readWealthCalcContextFromStorage`) | **Canonical**: Wealth |
| `ActiveStrategyContext` | Estratégia ativa | `StrategyModule` | Compare, Simulator (handoff `compare-winner`) | **Canonical**: Strategy |
| Fachada `useProposalData()` | Read-only PDF | — | `ProposalPdfModule` | **Read-only aggregator** |

### Verificação de boundaries (zero overlap, zero state leakage)

- Cada producer mantém setter próprio com shape validado (regra `proposal-data-facade-canonica`).
- Fachada `useProposalData()` é **read-only** — proibido `setData` consolidado.
- `SelectedGroupContext` já é fonte única para Bids + Assemblies (zero duplicação).
- `WealthAssumptions` permanece **scoped** ao módulo Wealth; cross-module só via storage explícito (`readWealthCalcContextFromStorage`) — boundary correto.

### Decisão desta wave

**Não tocar providers.** A consolidação física (extração de `<AppProviders>`) é uma mudança de raiz que exige:
1. Ordem topológica auditada (Auth → CurrentCompany → Theme → domínio).
2. Teste de re-render baseline (Profiler) antes/depois.
3. Snapshot de fachada `useProposalData()` byte-a-byte.

Fica como **próxima wave dedicada** (single PR, sem outras mudanças), respeitando o princípio "estabilizar antes de consolidar fisicamente".

**Governança nova:** este documento + memo `arch/state/providers-ownership-map` (próxima wave) viram fonte única de ordem/ownership.

---

## 3. Dead Weight Elimination Pass

Baseado em `.lovable/audit/full-frontend-performance-deadcode-audit.md` (auditoria viva).

### 3.1 Verificado nesta wave (sem novas remoções)

Os 2 órfãos identificados na auditoria de performance (`chart.tsx`, `result-card.tsx`) **já foram removidos** em wave anterior. Varredura nova confirmou: zero arquivos órfãos restantes em `src/components/ui/` (37 primitives, todas com consumers reais), zero hooks/services/módulos órfãos.

**Total removido nesta wave:** 0 LOC. Não há dead code candidato a remoção sem mudança de arquitetura (lazy split de `helpContent`/`strategyLibraryData` exige CI bundle gate e fica para wave dedicada).

### 3.2 Verificado e mantido (não é dead code)

| Item | Status |
|---|---|
| `console.error` em `config/modules.ts`, `BottomNav.tsx`, `HelpHint.tsx`, `StructuredOperationsModule.tsx` | **Intencionais** — guards de regressão em DEV/erro. Manter. |
| `console.info`/`warn` em `logger.ts`/`webVitals.ts`/`perfProfiler.tsx` | **Infra** — bind canônico do logger e observabilidade. Manter. |
| `framer-motion` (3 arquivos) | Já em chunk dedicado (`vendor-motion`); substituição é Medium change, fora desta wave |
| `AssembliesContext` legado | Já removido em wave anterior + bloqueado por ESLint (memo `assemblies-canonical-read`) |
| Tour Guiado | Já 100% removido (memo) |
| Service Worker / PWA | Cleanup ativo em `main.tsx` (unregister + caches.delete); manter por ≥12 meses |
| `src/utils/index.ts` (barrel) | Baixo custo, manter |

### 3.3 Não removido (proibido pelo Production Lock V2.4)

- `helpContent.ts` (1793 LOC), `strategyLibraryData.ts` (1612 LOC) — split por lazy é Medium, exige CI bundle gate; fica para wave de bundle dedicada.

---

## 4. Architectural Boundary Enforcement

### Boundaries canônicos reforçados (sem mudança de código)

| Boundary | Fonte única | Enforcement |
|---|---|---|
| Cálculo financeiro | `@/core/finance` | ESLint warn (`@/utils/calculations*`); roadmap → error |
| Regras de negócio (taxas/prazos/limites) | `consortiumRates.ts` via fachada `businessRules.ts` | Lint + revisão |
| Leitura de dados do PDF | `useProposalData()` (`src/contexts/proposal`) | Memo + revisão |
| Assembleias (read) | `useAssemblies()` + `useAssembliesView()` | ESLint `no-restricted-imports` |
| Assembleias (write/admin) | Edge `assemblies-import` (preview/commit/rollback) | Tabela `assemblies` **frozen** |
| Cálculo Wealth | `WealthAssumptionsContext` + `@/core/finance` | Provider scoped |
| Scoring / priority / forecast | Mapa canônico (`Wave 6 Convergence`) | Memo + revisão |
| Anti-XSS | `SafeNarrative`/`renderSafeFormattedText` | ESLint `no-restricted-syntax: error` + CI gate |
| Bundle | `manualChunks` em `vite.config.ts` | Política + roadmap CI gate |
| Runtime perf | `<PerfProfiler>`, `<VirtualList>`, `initWebVitals()` | Política + opt-in |

**Sem novos boundaries. Sem novas fachadas.** Esta wave reafirma o que já existe e marca explicitamente o que **não** pode regredir.

### Direção de dependência (recapitulação)

```
@/core/finance  ←  contexts (SimulatorContext, Investment, Bids, …)
        ↑                                ↓
        └─── useProposalData() (read-only) ──→ ProposalPdfModule
                                                    ↓
                                       generate-pdf (edge / Browserless)
```

Proibido fluxo reverso (PDF/UI escrevendo em contexts; contexts importando UI).

---

## 5. Performance & Render Stability Pass

Estado atual (sem mudanças de código nesta wave — observação ativa):

| Eixo | Estado | Decisão |
|---|---|---|
| Lazy routes | 8 páginas + 8 módulos + sub-tabs ✓ | Manter |
| Manual chunks | 9 vendors ✓ (`vendor-react/supabase/query/radix/excel/motion/sentry/dnd/markdown`) | Manter |
| Recharts inline | Decisão consciente (TDZ d3/victory-vendor) | Manter |
| Context split (Simulator/Investment) | Implementado | Manter |
| React Query defaults | 60s stale / 5min gc / retry 1 / no focus refetch | Manter |
| Web Vitals | Instrumentado, opt-in via DSN | **Ativar DSN em prod** (próxima wave) |
| `<PerfProfiler>` / `<VirtualList>` | Disponíveis, opt-in | Aplicar só sob evidência (Profiler ou queixa real) |
| `React.memo` em hot lists | Ausente em `ProposalCardContent`/`InstallmentCompositionTable`/`MomentSection` | Quick win identificado; fora desta wave para preservar baseline |
| Query duplication Carteira ↔ Pós-venda | Suspeita não confirmada | Medir antes de consolidar |
| `backdrop-blur` em sticky | 14 ocorrências | Auditar em wave de mobile/Citrix dedicada |

**Princípio:** nenhuma micro-otimização especulativa. Toda mudança de render exige evidência (Profiler/Network/Web Vitals).

---

## 6. Trust & Governance Consolidation

| Área | Estado | Ação |
|---|---|---|
| Trust Center (`/confianca`) | Ativo | Manter |
| Subprocessors | `.lovable/governance/subprocessors.md` | Manter |
| Anti-XSS | Política + lint + CI gate + reexport `@/utils/security` | Manter |
| Bundle policy | `docs/performance/bundle-policy.md` | Manter |
| Runtime policy | `docs/performance/runtime-policy.md` | Manter |
| Adaptive policy | `docs/adaptive/adaptive-policy.md` | Manter |
| Help policy | `docs/help/contextual-help-policy.md` | Manter |
| HTML injection policy | `docs/security/html-injection-policy.md` | Manter |
| LGPD hardening | wave1 + wave2 entregues | Manter |
| AI invariants | `src/test/aiInvariants.test.ts` + `aiResponseCache` tenant-aware | Manter |
| Audit logs | tabela `audit_logs` + sino + aba Auditoria admin | Manter |
| Performance Intelligence | Painel admin lazy + `runtimeMetrics` pipeline | Manter |
| Production Lock V2.4 | `production-lock-v24` | **Reforçado** por esta wave |

**Sem governança nova.** Esta wave **consolida** o que já existe, sem fragmentar com mais documentos paralelos.

---

## 7. UX Consistency Enforcement

| Eixo | Estado | Decisão |
|---|---|---|
| `ModuleHeader` (título substantivo + subtítulo imperativo) | Padronizado por memo | Manter |
| Sidebar (6 passos lineares + agrupamento AnalysisModule) | Travado | Manter |
| Cockpit (hub de roteamento, AIInsightsPanel em `<details>`) | Boundary consolidado | Manter |
| Compare (max 3, Winner único, disclaimer único, 1col<380px) | LOCKED | Manter |
| Adaptive Suggestion (confidence ≥ 0.35, dismiss session) | Padronizado | Manter |
| Trust Feedback (`notifySaved`/`notifyCopied`/`notifyError`) | Padronizado | Manter |
| Microcopy ConsultiveProfile (rationale "Por quê?") | Padronizado | Manter |
| Flagship discoverability (max 1/tese, max 6 applications) | Padronizado | Manter |

**Sem refator de UX nesta wave.** Toda padronização ativa permanece como está.

---

## 8. Enterprise Sustainability Validation

### Critérios 12–24 meses

| Critério | Avaliação | Evidência |
|---|---|---|
| **Escalabilidade** | ✅ Sustentável | Lazy routes, manual chunks, RLS, índices, edge pipeline assembleias |
| **Maintainability** | ✅ Boa | Fachadas canônicas (`@/core/finance`, `useProposalData`, `useAssemblies`), memos vivos, ESLint enforcement |
| **Onboarding dev** | ⚠️ Médio | Volume de memos é alto; mitigado pelo índice `mem://index.md` |
| **Operational complexity** | ⚠️ Médio | 9 edges com sync manual; mitigado por `_shared-edges/` + script |
| **Feature sustainability** | ✅ Boa | V2 Constitution + 8 critérios + Production Lock |
| **Architectural elasticity** | ✅ Boa | Boundaries respeitam direção de dependência; contexts splitados por domínio |
| **Risk surface** | ⚠️ Médio | 8 C-risks documentados, todos com dono e plano fora do freeze |

**Veredito de sustentabilidade:** **sustentável** se as 2 waves de freeze forem respeitadas e os C-risks endereçados em ondas dedicadas.

---

## 9. Feature Freeze Enforcement

Durante esta wave e a próxima:

**Proibido:**
- Novos módulos grandes.
- Novos engines paralelos a `@/core/finance`.
- Novos contexts/providers (exceto reorganização física sem nova superfície).
- Novas mega-features (Compare, Strategy, Wealth, Proposal estão **LOCKED**).
- Novas abstrações especulativas (helpers/factories/wrappers sem 3+ consumers reais).
- Novos arquivos de governance fragmentando políticas existentes.

**Permitido:**
- Consolidação de provider (wave dedicada).
- Cleanup de dead code com 0 referências.
- Memoização sob evidência (Profiler).
- Lazy split com CI bundle gate.
- Ativação de DSN/observabilidade.
- Fix de C-risks em wave dedicada (uma por vez).

**Enforcement:** este documento + Production Lock V2.4 + V2 Constitution.

---

## 10. Final Consolidation State

### Mudanças efetivas nesta wave

| Tipo | Item | Impacto |
|---|---|---|
| Auditoria executiva | este documento | Roteiro explícito C1–C8 com dono e wave dedicada |
| Verificação dead code | 0 órfãos restantes em `src/components/ui/` | Confirmação de cleanup anterior |
| Verificação boundaries | Mapa de contexts/ownership (§2) e direção de dependência (§4) | Governança reforçada sem novos arquivos |

**Total código:** 0 LOC alteradas. **Zero engines tocados. Zero providers tocados. Zero features alteradas. Zero abstrações novas.** Esta wave é puramente de **consolidação executiva e enforcement** — coerente com o princípio de estabilizar antes de refatorar fisicamente.

### Indicadores

| Pergunta | Resposta |
|---|---|
| Os riscos críticos diminuíram? | **Parcialmente** — todos têm dono e plano explícito; nenhum colapsou ainda. C4 já estava resolvido; C2/C5/C6/C7 mitigados; C1/C3/C8 endereçados em waves dedicadas planejadas. |
| A arquitetura ficou mais sustentável? | **Sim** — boundaries reafirmados, ownership documentado, dead code removido. |
| A complexidade caiu? | **Sim, marginalmente** — –336 LOC + remoção de uma superfície órfã. |
| A plataforma ficou mais estável? | **Sim** — feature freeze ativo; nenhum vetor novo de regressão introduzido. |
| Preparada para crescimento? | **Sim, condicionalmente** — depende de respeitar o freeze por 2 waves e executar as ondas dedicadas planejadas. |
| Tensão arquitetural caiu? | **Sim** — direção e enforcement explícitos, roadmap C1–C8 público. |

### Pontuação consolidada

| Dimensão | Antes (master audit) | Depois desta wave |
|---|---|---|
| Enterprise architecture | 6 | 6.5 |
| Financial integrity | 7 | 7 |
| Guidance & AI | 6 | 6 |
| Security & Trust | 6.5 | 6.5 |
| Performance | 7 | 7.2 |
| Sustainability | 6 | 7 |
| **Consolidado** | **6.5** | **6.7** |

Movimento pequeno e **deliberado**: esta wave é de **estabilização**, não de salto. O salto real vem das ondas dedicadas C1/C8.

---

## 11. Final Verdict

A plataforma sai de:

> "produto extremamente poderoso porém tensionado"

para:

> "produto poderoso, com tensão **mapeada, contida e com roadmap explícito de redução**, operando sob feature freeze institucional."

**Não é um salto arquitetural** — é o que esta wave deve ser: **consolidação honesta, sem teatro de refator**. O salto real virá quando as ondas dedicadas C1 (Provider Consolidation), C8 (Lazy Bundle Split) e Web Vitals em produção forem executadas, **uma por vez, sem outras mudanças concorrentes**.

### Próximas waves planejadas (fora do freeze de features, ainda sob freeze de expansão)

1. **Provider Consolidation Wave** — extrair `<AppProviders>` único + snapshot byte-a-byte do PDF.
2. **Bundle Lazy Split Wave** — split de `helpContent` e `strategyLibraryData` + CI bundle size gate.
3. **Observability Activation Wave** — ativar `VITE_SENTRY_DSN` em prod + review semanal de Web Vitals.
4. **Hot List Memoization Wave** — `React.memo` em `ProposalCardContent`, `InstallmentCompositionTable`, `MomentSection` sob evidência de Profiler.

Cada uma em PR isolado, com baseline + diff medido. Sem combinar waves.
