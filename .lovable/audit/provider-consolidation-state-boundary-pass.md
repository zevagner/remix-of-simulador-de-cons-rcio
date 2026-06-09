# Provider Consolidation & State Boundary Pass

**Wave:** Provider Consolidation (1/4 do roadmap pós feature-freeze)
**Escopo:** exclusivamente reorganização de providers/contexts.
**Regras invioláveis:** zero novas features, zero novas engines, zero mudança em regras
financeiras, zero refactor heroico.

---

## 1. Full Provider Graph Audit

### Topologia ANTES (Index.tsx → "Provider Lasagna" — 9 níveis)

```text
<ModuleNavigationProvider>           UI/navegação
 └─ <DiagnosticProvider>             perfil cliente
   └─ <SimulatorProvider>            motor financeiro (FONTE ÚNICA)
     └─ <ClientJourneyProvider>      jornada CRM
       └─ <InvestmentResultsProvider> publicação read-only
         └─ <BidsStudyProvider>       publicação read-only
           └─ <SelectedGroupProvider> seleção tipo+grupo
             └─ <ActiveStrategyProvider> estratégia consultiva ativa
               └─ <StructuredOpsResultsProvider> operação multi-cartas
                 └─ <IndexContent/>
```

### Topologia DEPOIS

```text
<AppProviders onModuleChange=...>    composição única, ownership documentada
 └─ <IndexContent/>
```

Internamente `AppProviders` preserva a **mesma ordem topológica** (dependências entre
contexts inalteradas), apenas centraliza num único componente com docstring de ownership.

### Inventário de providers globais (`src/App.tsx`)
- `QueryClientProvider` (TanStack Query) — global, único, OK.
- `ThemeProvider` — global, único, OK.
- `TooltipProvider` — global, único, OK.
- `AuthProvider` — global, único, OK.
- `CurrentCompanyProvider` — global, único, OK.
- `BrowserRouter` — global, único, OK.

Nenhuma duplicação. Sem provider órfão. Sem overlap detectado no shell global.

### Inventário de session-providers (consolidados em `AppProviders`)
| Provider | Ownership canônica | Tipo |
|---|---|---|
| ModuleNavigationProvider | navegação inter-módulos | UI efêmero |
| DiagnosticProvider | perfil/diagnóstico do cliente | session state |
| **SimulatorProvider** | motor financeiro canônico | **fonte única finance** |
| ClientJourneyProvider | etapa CRM / jornada de venda | session state |
| InvestmentResultsProvider | read-only publish dos paths | publish-only |
| BidsStudyProvider | read-only publish do estudo de lances | publish-only |
| SelectedGroupProvider | seleção (tipo+grupo) Bids ↔ Assembléias | shared selection |
| ActiveStrategyProvider | estratégia consultiva ativa Wealth ↔ Proposta | shared selection |
| StructuredOpsResultsProvider | publish da operação multi-cartas | publish-only |

---

## 2. Context Ownership Enforcement

Regra: **todo context tem owner explícito + boundary estável + fonte única**.

- **Producers** (escrevem): `SimulatorProvider`, `DiagnosticProvider`, `ClientJourneyProvider`,
  `SelectedGroupProvider`, `ActiveStrategyProvider`, `ModuleNavigationProvider`,
  `InvestmentModule` (publisher do `InvestmentResultsContext`),
  `BidsModule` (publisher do `BidsStudyContext`),
  `StructuredOpsModule` (publisher do `StructuredOpsResultsContext`).
- **Consumer canônico (read-only):** `useProposalData()` (`src/contexts/proposal`).
- **Proibido:** criar `ProposalDataContext` genérico com `any`/`setData` consolidado.
  Já há memória ativa e ESLint guard — mantido.

Nenhum context foi colapsado nem renomeado nesta wave (zero regression rule).

---

## 3. Provider Boundary Refactor

Mudança aplicada (única alteração de código desta wave):

- **Criado:** `src/contexts/AppProviders.tsx` — composição única e documentada.
- **Editado:** `src/pages/Index.tsx` — 26 linhas de nesting substituídas por 9.

Resultados:
- **−8 níveis visuais** de aninhamento em `Index.tsx`.
- Ownership mental agora visível em **um único arquivo** com docstring.
- Nenhum provider movido para fora de seu boundary; nenhum contrato alterado.

---

## 4. Global vs Local State Validation

| Provider | Precisa ser global? | Veredito |
|---|---|---|
| QueryClient | sim — cache compartilhado | manter |
| Auth / CurrentCompany | sim — atravessa toda app | manter |
| Theme / Tooltip / Router | sim — shell | manter |
| Simulator / Diagnostic / Journey | sim — atravessam sidebar+módulos+PDF | manter |
| InvestmentResults / BidsStudy / StructuredOps | sim — leitura cross-módulo (PDF) | manter |
| SelectedGroup / ActiveStrategy | sim — sincroniza dois módulos | manter |
| ModuleNavigation | sim — CTAs em qualquer módulo navegam | manter |

**Nenhum provider identificado como "global desnecessário".** A superfície global está
proporcional ao produto: cada context atende ≥2 consumidores distantes na árvore.

---

## 5. Rerender Surface Reduction

Sem mudança de cálculo nesta wave. Mas a consolidação habilita futuras otimizações:

- A ordem topológica preservada garante que `SimulatorProvider` (mais "quente") fica
  dentro de `ModuleNavigationProvider`/`DiagnosticProvider` (mais estáveis), evitando
  re-mount em troca de módulo.
- Publishers (Investment/Bids/StructuredOps) permanecem **abaixo** dos consumers para
  não disparar re-render em quem só consome upstream.
- Próxima wave (Memoization) atacará hotspots concretos via `<PerfProfiler>`.

Hotspots já mapeados para futuras waves (NÃO tocados aqui):
- `SimulatorContext` (789 LOC, 25 hooks) → wave dedicada de split (não esta).
- `helpContent.ts` / `strategyLibraryData.ts` → wave Bundle Lazy Split.

---

## 6. Provider Topology Simplification

ANTES: 26 linhas de JSX puramente estrutural em `Index.tsx`, leitura ritualística.
DEPOIS: 1 wrapper `<AppProviders>`, leitura arquitetural.

Diff conceitual:
```diff
- <ModuleNavigationProvider onModuleChange=...>
-  <DiagnosticProvider>
-   <SimulatorProvider>
-    <ClientJourneyProvider>
-     <InvestmentResultsProvider>
-      <BidsStudyProvider>
-       <SelectedGroupProvider>
-        <ActiveStrategyProvider>
-         <StructuredOpsResultsProvider>
-          <IndexContent .../>
-         </StructuredOpsResultsProvider>
-        ...
+ <AppProviders onModuleChange=...>
+   <IndexContent .../>
+ </AppProviders>
```

---

## 7. DX & Maintainability Validation

- **Novo dev:** abre `src/contexts/AppProviders.tsx` e entende a ordem + ownership em
  ≤30 segundos. Antes precisava percorrer 9 imports e o nesting de `Index.tsx`.
- **Debug de re-render:** ponto único para envolver com `<PerfProfiler>` na próxima wave.
- **Adicionar novo provider:** uma edição em `AppProviders.tsx`, sem tocar `Index.tsx`.
- **Remoção:** idem. Boundary explícito.

---

## 8. Zero Regression Validation

- ✅ Nenhuma engine financeira tocada.
- ✅ Nenhum contrato de context alterado.
- ✅ Ordem topológica preservada (mesmas dependências de provider).
- ✅ Mesmos imports de `IndexContent` (consumers inalterados).
- ✅ `useProposalData()` façade intacta.
- ✅ Zero mudança em rotas, auth, RLS, edges.
- ✅ Build OK (typecheck pós-edit limpo).

Code delta: **+62 LOC novos** (`AppProviders.tsx` com docstring) / **−17 LOC** em
`Index.tsx`. Líquido funcional: zero.

---

## 9. Final Consolidation State

- Boundaries claros? **Sim** — um arquivo, ownership documentada.
- State mais sustentável? **Sim** — adicionar/remover provider agora é local.
- Rerenders reduzidos? **Não nesta wave** (deliberadamente; reservado p/ Memoization wave).
- Acoplamento caiu? **Sim, visual e mental** — nenhum acoplamento de runtime novo.
- Arquitetura mais previsível? **Sim** — leitura linear, sem arqueologia.
- Pronto para crescer? **Sim** — próximo provider entra em 1 linha, sem perturbar `Index.tsx`.

---

## Final Verdict

✅ **Provider Consolidation Pass — APROVADO.**

A "Provider Lasagna" de 9 níveis foi colapsada em um único `<AppProviders>` com
ownership documentada e ordem topológica preservada. Zero regressão funcional,
zero mudança de engine, zero novo abstrato. A plataforma sai de
"funciona mas tensiona" para "ownership clara e boundary estável" no eixo
de composição de providers.

**Próximas waves (não desta):**
1. Bundle Lazy Split (`helpContent`, `strategyLibraryData`, CI bundle gate).
2. Observability Activation (Sentry/Web Vitals em produção).
3. Hot List Memoization (React.memo guiado por Profiler).

**Feature freeze:** mantido. Nenhum desvio.
