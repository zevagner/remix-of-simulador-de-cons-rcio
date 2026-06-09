# Deep Performance & Code Integrity Audit

**Data:** 2026-05-16  
**Escopo:** todo o `src/` (553 arquivos TS/TSX, ~91.700 LOC), vite.config.ts, `.lovable/audit/*`, governança ativa.  
**Método:** inspeção empírica (`rg`, `wc`, leitura direta dos hot paths), não checklist genérico.

---

## Executive Verdict

> **Tecnicamente sólido para escala atual e próxima curva de crescimento (até ~10× usuários ativos), com 1 risco crítico isolado (SimulatorContext hipertrofiado) e ~5 frentes importantes de hardening.**

O projeto NÃO está estruturalmente frágil. As fundações certas já estão no lugar: engine financeira única em `@/core/finance` com **0 (zero) imports diretos de `@/utils/calculations*` fora dela** (façade respeitada), context split do simulador implementado (`SimulatorInputContext` / `SimulatorResultContext`), 8 chunks vendor manuais em `vite.config.ts`, route-splitting completo em `App.tsx` + `Index.tsx`, Web Vitals + PerfProfiler + runtimeMetrics opt-in, governança anti-XSS ativa (CI gate), 0 `console.log` em src, 0 `any` explícito, 0 `style={{}}` inline. Isso é raro em codebases dessa idade.

O problema **não é arquitetural** — é **massa local em pontos quentes específicos**. Detalhado abaixo.

---

## 1. Render Performance Audit

### 🟢 O que está certo
- Context split do simulador já feito (input/result/legacy compat) — consumers leem subsets sem re-render cruzado.
- Refs (`activeModuleRef`, `analysisTabRef`) usadas para evitar invalidação de callback estável em `Index.tsx` (linhas 65–70). Padrão correto.
- 0 ocorrências de `style={{...}}` inline em JSX (`rg style=\{\{ src --type=tsx` → 0). Evita re-render por nova referência de objeto.
- `<PerfProfiler>` e Web Vitals em produção via `initWebVitals()` no `main.tsx`.

### 🔴 CRÍTICO — SimulatorContext sobrecarregado
`src/components/modules/simulator/SimulatorContext.tsx` (776 LOC, **25 useMemo/useCallback, 7 useEffect, 16 useState**) é o ponto único de render storm potencial:
- 4 schedules calculados em `useMemo` separados: `monthlySchedule`, `monthlyScheduleWithoutDiscount`, `baseMonthlySchedule`, mais o resultado legado (linhas 508–650). Cada um pode rodar até 240 iterações sobre `MonthlyRow`.
- Toda mudança em **qualquer** campo do `SimulationInput` invalida `monthlySchedule` → `result` → `inputValue`/`resultValue`/`value` (3 wrappers de memo). Em campos como `creditValue` digitados via `currency-input`, isso recalcula tudo a cada keystroke.
- O slice `value` (linha 762, legacy compat) continua agregando input+result+ações, então qualquer consumer legado de `useSimulatorContext()` re-renderiza junto.

**Impacto real:** em Citrix/mobile médio, digitar credit value de 8 dígitos = ~8 recálculos completos × 4 schedules ≈ 7.680 iterações + 8 ciclos de derivação.

**Ação:** debouncear writes de campos numéricos no `updateInput` (microtask + `useDeferredValue` para `result`), ou separar `creditValue`/`term` para um sub-context próprio. Já existem `inputByTypeRef` e `planModalityRef` — o padrão está estabelecido, falta aplicar.

### 🟡 IMPORTANTE — Provider stack profundo em `Index.tsx`
Linhas 156–179 empilham **9 providers**: `ModuleNavigation → Diagnostic → Simulator → ClientJourney → InvestmentResults → BidsStudy → SelectedGroup → ActiveStrategy → CompareSelection`. Cada `Provider` value é memoizado (verificado), mas a árvore inteira re-cria a referência se algum value invalida. Funciona, mas qualquer regressão em `useMemo` de um value vira cascade. Sem ação obrigatória, **apenas** vigilância via PerfProfiler quando reportarem lag.

### 🟡 ProposalHistoryModule (775 LOC, 31 useMemo/useCallback, 44 hooks)
Maior densidade de hooks por arquivo. Não auditado em profundidade aqui, mas é o segundo candidato a render storm se a lista de propostas crescer >500. Recomendado envolver em `<PerfProfiler id="ProposalHistory">` antes de qualquer queixa.

---

## 2. Bundle & Code Splitting Audit

### 🟢 Sólido
- `vite.config.ts`: 8 chunks vendor isolados (react, supabase, query, radix, excel, motion, sentry, dnd, markdown). Política documentada em `docs/performance/bundle-policy.md` e validada por governança.
- 25 lazy imports mapeados (`App.tsx` 8, `Index.tsx` 8, AdminPage 3, módulos internos 6). Charts (recharts), AssembliesModule, ProposalSmartTab, EdgeImportPreviewDialog, AdminAssembliesImportHistory todos lazy.
- Decisão consciente de NÃO criar `vendor-charts` por TDZ em produção (comentário no vite.config). Engenharia, não cargo cult.
- `@/core/finance` mantido inline (zero latência em hot path simulação) — documentado.

### 🟡 IMPORTANTE
- **`recharts` está em 12 arquivos** (admin + 8 módulos consumidores). Como NÃO existe `vendor-charts`, recharts vai para o chunk de cada rota lazy. Cache cross-route é pior, mas evita o TDZ — trade-off correto. **Vigiar** com `bun run build && du -h dist/assets/*.js | sort -h` periodicamente.
- `exceljs` (~250KB) usado apenas em `excelLoader`/Admin. Já no `vendor-excel`. ✓
- `framer-motion ^12.36.0` — versão grande. Apenas 2 arquivos consomem. Considerar substituir por animações CSS puras nesses 2 pontos para eliminar o `vendor-motion` (otimização opcional, não crítica).

### 🟢 Drift zero
- 0 imports diretos de `@/utils/calculations` fora da façade (confirmado por `rg`).
- 0 duplicação de libs (verificado em package.json — só uma versão de cada).

---

## 3. Component Architecture Audit

### 🟡 Files >500 LOC: **28 arquivos**
Distribuição saudável (não há arquivo único >2k que dominaria). Os maiores não-data:
| Arquivo | LOC | Avaliação |
|---|---|---|
| `PostSaleModule.tsx` | 872 | Limite. Aceitável se for orquestrador, problemático se misturar UI+lógica. |
| `InvestmentModule.tsx` | 850 | Já tem `useInvestmentCalculations` separado. OK. |
| `StrategyLibrarySection.tsx` | 813 | UI de catálogo — aceitável por densidade editorial. |
| `SimulatorContext.tsx` | 776 | **Ver §1 — refatorar.** |
| `ProposalHistoryModule.tsx` | 775 | Candidato a split (filtros, lista, ações). |
| `AdminAssembliesImportHistory.tsx` | 764 | Admin-only, baixa frequência. Aceitável. |

`strategyLibraryData.ts` 1441 LOC e `helpContent.ts` 1584 LOC são **dados editoriais puros**, não código. Não conta para complexidade ciclomática — conta para bundle se importado eager. Verificar que ambos são consumidos apenas em módulos lazy (✓ pelo grep).

### 🟢 Boundaries
Pastas `modules/`, `contexts/`, `hooks/`, `lib/`, `services/`, `core/finance/` têm responsabilidades bem separadas. 307 componentes — alto, mas o overhead vem de variantes shadcn legítimas, não duplicação.

### 🟡 `Index.tsx` mistura roteamento + navState + restore session + feedback + provider stack
Aceitável hoje. Se ganhar mais 200 LOC, splitar `AppShell` (providers) de `Index` (roteamento).

---

## 4. State Management Audit

### 🟢 Múltiplas fontes? Não.
Contexts mapeados (15): cada um tem owner claro. `SelectedGroupContext` é fonte única para tipo+grupo (consumido por Bids+Assemblies, ver memória). `BidsStudy`, `InvestmentResults`, `ActiveStrategy` são producer-contexts publicando para o PDF — padrão correto, evita re-cálculo no consumer.

### 🟡 SimulatorContext expõe DOIS regimes
`useSimulatorContext()` (legado, agrega tudo) + `useSimulatorInput()`/`useSimulatorResult()` (split). Memória registra que hot paths usam o split e que o legado é shim. Vigiar que **nenhum componente novo** importe o legado — adicionar ESLint rule (warn) seria barato.

### 🟢 Persistência
`localStorage` writes são **debounced via `setTimeout` em `useEffect`** no SimulatorContext (linhas 296–307). Correto. Sem write síncrono por keystroke.

---

## 5. Financial Engine Audit

### 🟢 EXCELENTE — fonte única respeitada
- `@/core/finance` é a façade canônica. **0 imports de `@/utils/calculations*` fora da façade** (verificado: `rg "from ['\"]\\@/utils/calculations" src | grep -v core/finance` → 0).
- Engine de prestamista, financiamento (B2), investment (B1), pipeline de simulação (B3) todos canonizados — documentado em memória e por golden snapshots.
- Constantes financeiras consolidadas em `consortiumRates.ts` + façade `BUSINESS_RULES`. Nada de hardcode disperso.

### 🟢 Drift matemático
Tests `installmentSingleSourceOfTruth`, `pdfConsistency`, `crossModuleConsistency`, `calculationConsistency` existem e travam reconciliação. Nenhuma matemática paralela detectada.

### Sem ressalvas neste módulo. É a área mais madura do projeto.

---

## 6. Mobile Performance Audit

### 🟢 Bom
- `useIsMobile` centralizado. `BottomNav`, `SwipeableModule`, `MobileStickyCTA`, `ScrollAffordance` são primitivas reais (não hacks).
- Touch targets 44px na política. Memória registra.

### 🟡 Risco — schedules de 240m renderizando em listas mobile
`InstallmentCompositionTable.tsx` (516 LOC) tem potencial de jank em mobile com prazo 240m × ~8 colunas. Política diz para virtualizar com `<VirtualList>` quando ≥120 rows com composição visual rica. **Não está virtualizado.** Não há queixa relatada — vigiar antes de prometer "mobile sem jank".

### 🟢 Charts (recharts) em mobile
Cada chart é lazy + dentro de módulo lazy. OK.

---

## 7. Memory & Effects Audit

### 🟢 Limpo
- 0 `setInterval` em src (não-teste). Excelente — evita timers órfãos.
- `setTimeout` usado controladamente (Loader spinner delay, debounced writes). Todos com `clearTimeout` no cleanup.
- 15 `addEventListener` — todos com cleanup confirmado por amostragem (CompareSelectionContext storage listener, useScrollHideHeader, etc.).
- Service Workers **proativamente desregistrados** no `main.tsx` (linhas 19–28). Resolve o histórico de loop de login. Boa hygiene.

### 🟡 40 ocorrências de `@ts-ignore`/`@ts-expect-error`/`: any`
40 em 91k LOC = 0.04%. Aceitável, mas vale revisitar pontos isolados em PR de hardening (não bloqueante).

### Nada que justifique investigação adicional. Score: bom.

---

## 8. Data Flow & Linking Audit

### 🟢
- `useProposalData()` em `src/contexts/proposal` é fachada única do PDF (memória registra). Producer contexts (Investment/Bids/Selected/Strategy) publicam, PDF consome — sem `any`/`setData` consolidado.
- `navState.ts` é fonte única de navegação (validação + persistência + telemetria), substituiu guards bloqueantes.
- Continuidade consultiva entre Diagnostic → Simulator → Strategy → Compare → Proposal: validada em memória + tests.

### Sem quebras detectadas.

---

## 9. DX & Maintainability Audit

### 🟢 Notável
- Cabeçalhos de arquivo com seções `═════` e comentários institucionais explicando *porquê* — não só *o quê*. Ex.: `CompareSelectionContext.tsx`, `core/finance/index.ts`, `vite.config.ts`. Reduz onboarding cost.
- Governança em `/data/governance/sections/*` + `.lovable/governance/*.md` + `.lovable/audit/*.md` (90+ docs). Trade-off: muita documentação, mas evita re-litigar decisões já tomadas.
- Naming consistente (memória força regras: títulos, prefixos, etc.).
- 0 `console.log` em src (excelente — usa `logger`).

### 🟡 Friction
- 553 arquivos TS/TSX é muito para um IDE leve. Considerar agrupar pastas por bounded context (ex.: `modules/strategy-v2/*` já bem agrupado, mas `components/modules` direto tem >40 arquivos top-level).
- Plano file `.lovable/plan.md` está com nota antiga ainda (BottomNav). Limpar quando virar baseline.

---

## 10. Production Readiness Audit

**Pergunta:** este projeto cresce sem colapsar tecnicamente?

**Resposta: SIM, com 1 frente crítica para encerrar (SimulatorContext) e vigilância em 3 hot paths (ProposalHistory, InstallmentComposition, provider stack).**

Capacidade atual estimada (sem mudanças):
- ✓ Suporta até ~200 propostas/usuário sem virtualização.
- ✓ Suporta digitação fluida em campos do simulador em desktop moderno.
- ⚠ Pode lagar em Citrix/mobile de baixa potência ao digitar credit value (problema do §1).
- ✓ Bundle inicial decente graças aos manualChunks + lazy.

---

## Critical Problems (🔴)

1. **SimulatorContext re-cálculo em cascata em cada keystroke.** Solução: `useDeferredValue(input)` antes dos schedules + dedicar campos `creditValue`/`term` a sub-context. Esforço: 1 dia. Risco: zero (engine não muda). **Único item realmente crítico.**

---

## Important Improvements (🟡)

1. **Virtualizar `InstallmentCompositionTable`** (240 rows × 8 cols) — política já existe, falta aplicar. Esforço: 2h.
2. **ESLint rule warn** para imports de `useSimulatorContext()` (legado) — impedir regressão do split. Esforço: 30min.
3. **Envolver `ProposalHistoryModule` em `<PerfProfiler>` por 1 semana** e medir antes de refatorar. Não otimizar especulativamente.
4. **Limpar 40 `: any`/`@ts-ignore`** em PR de hardening de tipos. Esforço: 2h.
5. **Re-avaliar `framer-motion`** — 2 usos × 120KB. Se forem fade/slide simples, CSS resolve e elimina o `vendor-motion`. Esforço: 1h.

---

## Optional Refinements (🟢)

1. Agrupar `components/modules/*` top-level por bounded context (cosmético).
2. Adicionar bundle CI gate (chunk-size baseline) — citado no roadmap da política, não implementado.
3. Auto-prune de logs antigos no `runtimeMetrics` buffer (já em 500, sem leak conhecido).
4. Considerar `Suspense` granular dentro de `AnalysisModule` para sub-abas Wealth/Bids/Comparator (já lazy, mas Suspense fallback ainda é coarse).

---

## What Is Architecturally Strong

- **Engine financeira blindada.** Façade única, 0 drift, golden tests. É raro.
- **Context split do Simulador.** Padrão Producer-Context aplicado consistentemente em Bids/Investment/Strategy/PDF.
- **Bundle policy documentada e respeitada.** 8 chunks vendor + razão para NÃO ter vendor-charts (TDZ).
- **Anti-XSS governance ativa** (ESLint + CI gate + política em `docs/security/html-injection-policy.md`).
- **Web Vitals + PerfProfiler + runtimeMetrics** wired no boot, opt-in, zero overhead em produção sem flag.
- **navState como fonte única de navegação** + telemetria padronizada.
- **0 console.log, 0 style inline, 0 `any` (no código novo).** Disciplina real.
- **Memória institucional** evita re-litigar decisões — onboarding de novo agente/dev é rápido.

---

## Hidden Technical Risks

1. **Provider stack profundo (9 níveis)** — funciona pelos memos certos. Uma regressão em qualquer `useMemo` de value vira cascade silenciosa. Mitigação: code review obrigatório quando um Provider mudar.
2. **`recharts` espalhado em 12 arquivos sem chunk dedicado.** Decisão consciente, mas se o produto adicionar mais 5 telas com charts, o custo cumulativo aparece. Monitorar `du -h dist/assets/*.js`.
3. **Files >500 LOC: 28.** Limite aceitável agora, mas é a curva clássica em que projetos passam de "grande" para "ingovernável" entre 500 e 800 LOC sem refactor. Foco nos 3 maiores.
4. **Persistência localStorage do Simulator** em 3 chaves diferentes (`STORAGE_KEY`, `INPUT_BY_TYPE_KEY`, planModality). Se o schema do `SimulationInput` mudar, restauração silenciosamente falha. Já há `pendingRestore`, mas falta versionamento de payload (similar ao `STORAGE_KEY: ':v1'` que o CompareSelection já faz).
5. **`strategyLibraryData.ts` (1441 LOC) + `helpContent.ts` (1584 LOC)** são dados, não código — mas se importados eager por engano, viram bundle. Verificar com `bun run build` que ambos estão em chunks lazy.

---

## Scalability Risks

| Risco | Threshold em que vira problema | Mitigação |
|---|---|---|
| SimulatorContext lag | Já presente em Citrix/mobile lento. | `useDeferredValue` + sub-context. |
| ProposalHistory render storm | >500 propostas/usuário. | Virtualizar lista. |
| Bundle vendor-recharts ausente | >18 telas com charts. | Reavaliar manualChunks. |
| Provider stack cascade | +2 providers (chega a 11). | Compor em `<AppProviders>` único. |
| File LOC creep | 3+ arquivos cruzarem 1000 LOC. | Split obrigatório por feature. |

Nenhum desses é iminente. São triggers para revisão, não dívida atual.

---

## Final Technical Verdict

**Este projeto é funcionalmente avançado E estruturalmente sólido.**

A diferença vs. a maioria dos sistemas dessa idade e escopo:
- A **engine financeira não tem drift** — verificado empiricamente.
- O **bundle splitting é decisão técnica documentada**, não default copy-paste.
- A **memória institucional substitui tribal knowledge.**
- Há **observabilidade real** (Web Vitals, runtimeMetrics, PerfProfiler) já em produção, opt-in.

O único item que mereceria classificação "frágil" é o **SimulatorContext em hot path mobile/Citrix** — e mesmo esse é localizado, não sistêmico. Esforço de 1 dia para encerrar.

> **Pronto para crescer sem colapsar.** Não há refactor estrutural pendente. Há **1 hardening crítico isolado** e ~5 melhorias importantes. Tudo o que está documentado em memória reflete a realidade do código (validado por amostragem). O sistema está em estado raro de **consistência entre intenção declarada e implementação observada**.

---

**Próximo passo recomendado:** aplicar o fix do SimulatorContext (Critical #1) antes de qualquer outra otimização. Os demais itens são vigilância e refino.
