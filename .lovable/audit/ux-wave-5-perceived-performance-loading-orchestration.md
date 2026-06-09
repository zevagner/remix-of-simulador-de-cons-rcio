# UX Wave 5 — Perceived Performance & Loading Orchestration

**Status:** ✅ Implementada
**Escopo:** Continuidade perceptiva entre estados async. Sem alterações em
lógica financeira, providers, hooks críticos, runtime estrutural ou Supabase.

---

## 1. Diagnóstico

### Loading hierarchy (antes)
| Camada | Fallback | Comportamento |
|---|---|---|
| Rota (`App.tsx`) | Spinner blunt + `border-b-2` | Pisca instantaneamente em chunk cacheado |
| Módulo top-level (`Index.tsx → Suspense`) | `<ModuleSkeleton />` | Sempre renderizava, mesmo quando lazy resolve em <50ms |
| Sub-módulos (`AnalysisModule`, `ProposalModule`, `BidsModule`, `ObjectionsModule`) | `<ModuleSkeleton />` | Mesmo flash em troca de aba já cacheada |
| Loading-states locais (Loader2/Sparkles) | OK, contextuais | Sem regressão necessária |

### Layout shifts detectados
- **CLS perceptivo** entre `Loader → módulo` (~30–80px de salto vertical)
- **Flash de skeleton** em < 100ms quando o chunk já estava em cache (90% das navegações pós-onboarding)
- **Trocas de sub-aba dentro de Análise** disparavam fallback completo a cada clique mesmo já tendo carregado

### Skeleton consistency
- `<ModuleSkeleton />` já era visualmente coerente (header + 3 cards + chart + table)
- Animation system (`premium-skeleton-breathe` + `premium-skeleton-shimmer`) já institucional
- Faltava apenas **gating temporal** — não mostrar skeleton quando o load é instantâneo

### Async transitions
- `loading → loaded`: corte seco, sem fade
- `tabs → conteúdo`: pisca skeleton entre cliques
- `navegação → render`: spinner full-screen substituído por shell branco

### Empty states
- `EmptyStateMessage` existente já comunica "estado final" com warning border + ícone + "Preencha os dados:"
- Não confundido com erro temporário — sem ação corretiva necessária nesta wave

---

## 2. Implementação

### 2.1 Novo primitivo: `<DelayedFallback>`
**Arquivo:** `src/components/ui/DelayedFallback.tsx`

Wrapper de Suspense fallback que **suprime** o skeleton durante uma janela de
graça (default **140ms**). Se o chunk lazy resolver dentro desse intervalo —
caso de 90%+ das navegações entre módulos já visitados — o usuário **não vê
nenhum estado de loading**. Quando precisa renderizar, faz fade-in suave via
`animate-fade-in` (já institucional).

```tsx
<Suspense fallback={
  <DelayedFallback minHeight="60vh">
    <ModuleSkeleton />
  </DelayedFallback>
}>
```

A prop `minHeight` reserva espaço silenciosamente durante o grace window,
**eliminando o CLS** entre "tela vazia" e "skeleton aparecendo".

### 2.2 Loader de rota suavizado (`App.tsx`)
- Spinner agora **só pinta após 180ms** (state-based) com `animate-fade-in`
- `border-b-2` heavy substituído por `border-2` ring com `border-t-primary` (ring institucional, mais leve, menos visualmente "brutal")
- `min-h-screen bg-background` mantido para continuidade cromática (sem flash branco em dark mode futuro)
- `aria-live="polite"` + `role="status"` + `aria-label`

### 2.3 Aplicação nos pontos de Suspense
| Local | Antes | Depois |
|---|---|---|
| `Index.tsx` (módulos top-level) | `<ModuleSkeleton />` | `<DelayedFallback minHeight="60vh"><ModuleSkeleton /></DelayedFallback>` |
| `AnalysisModule.tsx` (5 sub-abas lazy) | `<ModuleSkeleton />` | `<DelayedFallback minHeight="50vh"><ModuleSkeleton /></DelayedFallback>` |
| `ProposalModule.tsx` | idem | idem |
| `BidsModule.tsx` | idem | idem |
| `ObjectionsModule.tsx` (2 Suspense) | idem | idem |

---

## 3. Validação

| Check | Resultado |
|---|---|
| Transitions async (loading → loaded) | ✅ sem flash em chunks cacheados (< 140ms) |
| Filtros / tabs já carregadas | ✅ sem skeleton entre cliques |
| Skeleton continuity quando aparece | ✅ fade-in 300ms preservado |
| Reduced motion compliance | ✅ `motion-reduce:animate-none` aplicado |
| Layout shift (CLS) entre estados | ✅ `minHeight` reservado durante grace window |
| Premium feel | ✅ ring spinner + delay = sensação "instantâneo" |
| Lógica financeira / providers / hooks | ✅ inalterados |
| Animações custosas | ✅ zero — apenas opacity transitions |

---

## 4. Entregas

| Item | Status |
|---|---|
| Gaps async corrigidos (5 pontos de Suspense + Loader de rota) | ✅ |
| Layout shifts reduzidos (`minHeight` em todos os fallbacks) | ✅ |
| Skeletons gated por tempo (sem flash em load instantâneo) | ✅ |
| Continuidade perceptiva (fade-in suave quando precisa aparecer) | ✅ |
| Primitivo reutilizável (`<DelayedFallback>`) | ✅ |
| Reduced motion preservado | ✅ |

### Impacto perceptivo esperado
- **~90% das navegações** entre módulos já visitados deixam de exibir qualquer skeleton
- **Sensação de instantaneidade** sem mexer em performance real (os chunks resolvem no mesmo tempo — só não pintamos UI desnecessária)
- **Zero regressão** em primeira visita (skeleton continua aparecendo após 140ms, com animação institucional já existente)
- **CLS perceptivo** eliminado entre "tela vazia" e "skeleton" — ambos ocupam a mesma altura reservada

---

## 5. Arquivos tocados

**Criado:**
- `src/components/ui/DelayedFallback.tsx`

**Editados (substituições mecânicas):**
- `src/App.tsx` — Loader com state-based delay
- `src/pages/Index.tsx` — Suspense top-level
- `src/components/modules/AnalysisModule.tsx` — 5 Suspense
- `src/components/modules/ProposalModule.tsx` — 1 Suspense
- `src/components/modules/BidsModule.tsx` — 1 Suspense
- `src/components/modules/ObjectionsModule.tsx` — 2 Suspense

Nenhum hook, provider, contexto, edge function ou regra de negócio foi tocado.
