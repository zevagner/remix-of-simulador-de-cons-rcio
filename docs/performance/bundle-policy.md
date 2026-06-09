# Bundle & Performance Policy

**Owner:** Principal Performance Engineering
**Status:** Active · institutional
**Updated:** 2026-05-12 (Performance Hardening Wave)

## Princípios

1. **Boot enxuto.** Entry inicial só contém: React, router, Supabase client,
   layout chrome, autenticação. Tudo restante é lazy.
2. **Long-term cache.** Vendor pesado vive em chunk próprio (`vendor-*`)
   para que mudanças em features não invalidem o cache do navegador.
3. **Engine financeiro inline.** `@/core/finance` permanece com o consumer
   principal — zero indireção em hot paths.
4. **Sem drift matemático.** Otimização nunca pode mover/duplicar
   matemática financeira. Lazy/chunk apenas reposiciona código.

## Manual chunks (vite.config.ts)

| Chunk | Conteúdo | Motivo |
|---|---|---|
| `vendor-react` | react, react-dom, scheduler, react-router | Entry crítico, isolado p/ cache |
| `vendor-supabase` | @supabase/* | Sempre presente, mas estável |
| `vendor-query` | @tanstack/* | TanStack Query |
| `vendor-radix` | @radix-ui/* | Primitives agrupados |
| `vendor-charts` | recharts, d3-* | Pesado (~150 KB), só em telas analíticas |
| `vendor-excel` | exceljs | ~250 KB, só no parser de assembleias |
| `vendor-motion` | framer-motion | ~120 KB |
| `vendor-sentry` | @sentry/* | Observabilidade |
| `vendor-tour` | intro.js | Onboarding pontual |
| `vendor-dnd` | @dnd-kit/* | Apenas Kanban CRM |
| `vendor-markdown` | react-markdown | Surfaces específicas |

## Lazy policy

Já lazy-loaded (mantém):

- Todas as páginas (`App.tsx` lazy routes).
- Módulos de aplicação dentro de `Index.tsx`: Analysis, Proposal, Help,
  ProposalHistory, Objections, PostSale, Community, ProposalPdf.
- Sub-tabs pesadas: AnalysisModule (Investment/Comparator/Bids/Structured/Assemblies),
  ProposalModule (Template/AI), ObjectionsModule (Smart/FollowUp).

Regras para nova feature:

- Componente >30 KB ou que importa lib do `vendor-charts/excel/dnd/tour`
  DEVE ser `React.lazy` no consumer.
- Suspense fallback deve ser skeleton leve (sem layout shift).

## Memoization policy

- `useMemo`/`useCallback` somente quando há ganho real (dep estável + custo).
- Hooks financeiros pesados (Investment, Comparator) já estão divididos
  em sub-hooks por path/cenário (ver memórias `Investment Hook Split`,
  `Simulator Context Split Real`). Manter padrão.
- Proibido `useMemo(() => obj, [])` para "estabilizar referência" sem
  necessidade — adicione apenas onde reduz re-render mensurável.

## Query policy (TanStack Query)

- `staleTime` padrão por escopo:
  - Dados de domínio raramente mutáveis (groups, rates): `5 * 60_000` ms.
  - Listas operacionais (proposals, post-sale): `30_000` ms.
  - Métricas/analytics: `60_000` ms.
- `gcTime` ≥ `staleTime * 5`.
- Query keys: tupla estável `[scope, params]`. Nunca objetos inline.
- Invalidação: granular por escopo, nunca `queryClient.invalidateQueries()` sem chave.

## Chart policy

- Recharts apenas em rotas analíticas (Bids, Investment Cenários, Admin).
- Componentes de chart devem ser `React.lazy` se não fizerem parte do
  primeiro paint da rota.
- Dados de chart > 500 pontos: aplicar downsampling antes do render.

## Drift guard

- Nova lib >50 KB gzipped: PR DEVE adicionar entrada em `manualChunks`.
- Imports diretos de barrel pesado (ex.: `import * as RC from 'recharts'`):
  proibido — sempre named imports.
- Auditoria periódica: gerar `vite build` e verificar tamanho de chunks
  vendor-*. Crescimento >20% requer justificativa.

## Roadmap pendente (próximas ondas)

- **Render audit:** instrumentar `<Profiler>` em rotas-chave (Carteira,
  Cockpit, Simulador) para detectar render storms.
- **Virtualization:** introduzir `@tanstack/react-virtual` em listas
  >200 itens (Carteira, Comunidade, schedules de 240+ meses).
- **Query consolidation:** mapear queries duplicadas entre Carteira e
  Pós-venda e unificar via shared hook.
- **Bundle CI gate:** falhar build se `vendor-*` crescer >30% vs baseline.
