# Runtime Performance Policy

**Owner:** Principal Performance Engineering
**Status:** Active · institutional
**Updated:** 2026-05-12 (Runtime Performance & Virtualization Wave)

## Princípios

1. **Medir antes de otimizar.** Nenhuma virtualização, memoização ou
   refactor de hook entra no codebase sem evidência (Profiler, Web Vitals,
   render count). Otimização especulativa é proibida.
2. **Engine financeiro intocável.** Toda otimização preserva
   `@/core/finance` como fonte única; zero matemática paralela.
3. **Zero overhead em produção sem flag.** Profiler é opt-in
   (`?perf=1` ou `localStorage perf:profile=1`).

## Building blocks oficiais

| Util | Caminho | Quando usar |
|---|---|---|
| `<PerfProfiler id="...">` | `@/lib/perfProfiler` | Investigar render storms localmente |
| `<VirtualList>` | `@/components/perf/VirtualList` | Listas >200 itens ou schedules ≥120 linhas com render pesado |
| `initWebVitals()` | `@/lib/webVitals` | Já chamado em `src/main.tsx` — não duplicar |

## Virtualization rules

- ✅ Virtualizar quando: lista >200 itens **ou** schedule ≥120 linhas com
  composição visual rica (>5 spans/row, badges, etc.).
- ❌ NÃO virtualizar: listas <100, grids 2-3 cards, tabelas <50 linhas
  simples (header+texto). Over-virtualization piora UX (scroll jumps,
  perda de Cmd+F nativo).
- Container DEVE ter altura definida (`height` prop). Sem altura = scroll
  do parent = virtualização inútil.
- Sticky headers preservados via `position: sticky` no row 0 fora do
  viewport virtualizado, OU via header separado acima do `VirtualList`.

## Profiling rules

- Profiler ativa-se com `localStorage.setItem('perf:profile','1')` ou `?perf=1`.
- Threshold padrão: 16ms (1 frame @ 60fps). Loga `console.warn`.
- Em produção, sem flag, é passthrough — zero overhead.
- Hot paths recomendados para envolver: `Carteira`, `Cockpit`, `Simulador`,
  `Investment`, `Comparador`, `Comunidade`. Aplicar quando investigar
  problema reportado, não preventivamente.

## Query rules (TanStack Query)

- staleTime escalonado (ver `bundle-policy.md`).
- **Duplicação suspeita:** Carteira ↔ Pós-venda compartilham
  `proposals`. Antes de criar shared hook, confirmar via Network panel
  que há 2 requests separados (mesma chave evita).
- Query key = tupla estável `[scope, ...params]`. **Nunca** objeto inline.
- `enabled` para evitar waterfall — só dispara quando deps prontas.
- Invalidação granular: `queryClient.invalidateQueries({ queryKey: [scope] })`.
  Proibido invalidação global sem chave.

## Memoization rules

- `useMemo`/`useCallback` apenas com:
  - **Custo real** do cálculo (>1ms ou alocação grande).
  - **Dependências estáveis** (sem objetos/arrays inline).
  - **Consumer downstream** que se beneficia (memo, deps de effect).
- Proibido `useMemo(() => obj, [])` para "estabilizar referência" sem
  evidência de re-render mensurável.

## Render rules

- Context split obrigatório quando consumers diferentes leem subsets
  diferentes. Já aplicado: `SimulatorContext` (input/result), `Investment`
  (path1..6), `SelectedGroup`, `BidsStudy`, `InvestmentResults`.
- Novos contexts seguem o padrão.
- `key` em listas DEVE ser identidade de domínio (id), nunca índice
  para listas ordenáveis/filtráveis.

## Web Vitals & observabilidade

- `initWebVitals()` em `main.tsx`:
  - DEV/preview: `console.info('[web-vitals] ...')`.
  - Prod com Sentry DSN: breadcrumbs em todos os eventos +
    `captureMessage('web-vitals/<metric>=poor', 'warning')` quando rating poor.
- Targets institucionais:
  | Métrica | Bom | Atenção | Ruim |
  |---|---|---|---|
  | LCP | <2.5s | <4s | ≥4s |
  | INP | <200ms | <500ms | ≥500ms |
  | CLS | <0.1 | <0.25 | ≥0.25 |
  | FCP | <1.8s | <3s | ≥3s |
  | TTFB | <800ms | <1.8s | ≥1.8s |

## Drift guard

- Toda nova lista/tabela com potencial >200 itens DEVE consultar esta
  política antes de renderizar via `.map()` direto.
- Toda nova métrica de runtime cara (FPS, scroll latency) DEVE usar
  `<PerfProfiler>` para diagnosticar antes de reescrever.

## Roadmap pendente

- Aplicar `<VirtualList>` em alvos confirmados após medição (candidatos
  iniciais: schedules de 240m, Carteira com >200 propostas, Comunidade).
- Consolidar queries Carteira ↔ Pós-venda quando duplicação for confirmada.
- Adicionar bundle CI gate (chunk size baseline).
- Dashboard interno de Web Vitals (admin) consumindo Sentry breadcrumbs.
