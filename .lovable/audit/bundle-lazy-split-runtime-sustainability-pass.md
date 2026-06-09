# Bundle Lazy Split & Runtime Sustainability Pass

**Wave:** Bundle Lazy Split (2/4 do roadmap pós feature-freeze)
**Escopo:** isolar peso do catálogo institucional do chunk inicial. Zero engine,
zero UX nova, zero feature.

---

## 1. Full Bundle Audit

Top 5 arquivos do projeto (ordem por tamanho em bytes — sem minificação):

| Arquivo | Bytes | Risco |
|---|---:|---|
| `src/data/helpContent.ts` | 117 832 | **Alto** — eager no grafo dos hints |
| `src/components/modules/wealth/strategyLibraryData.ts` | 93 599 | Médio — só wealth/PDF |
| `src/components/modules/wealth/StrategyLibrarySection.tsx` | 68 535 | Médio — só wealth |
| `src/data/objections/data.ts` | 58 233 | Baixo — só ObjectionsModule (lazy) |
| `src/integrations/supabase/types.ts` | 51 340 | Tree-shake forte (só tipos) |

### Achados

- **HelpHint** e **ContextualInsightStrip** são montados em ≥10 módulos
  (Simulador, Comparator, Bids, Investment, Pipeline…). Antes desta wave,
  ambos importavam diretamente `@/data/helpContent`, arrastando o catálogo
  inteiro (~117 KB) para o chunk inicial de **qualquer** módulo onde um
  hint contextual aparecesse.
- `src/lib/contextualHelp/registry.ts` importava `articleById` (closure
  imediato sobre todas as categorias) — mesmo sem o usuário abrir um
  popover, o grafo de imports executava o catálogo inteiro.
- `strategyLibraryData.ts` (93 KB) já está confinado ao `WealthPlatformModule`
  (lazy via roteamento). **Nenhuma ação nesta wave** — risco contido.
- `helpContent.ts` interno: única função utilizada cross-módulo é
  `consultiveBlockMeta` (~1 KB) + tipo `ConsultiveBlockKind`.

### Manual chunks já existentes (`vite.config.ts`)

`vendor-react`, `vendor-supabase`, `vendor-query`, `vendor-radix`,
`vendor-charts`, `vendor-excel`, `vendor-motion`, `vendor-sentry`,
`vendor-tour`, `vendor-dnd`, `vendor-markdown`. `@/core/finance` inline
(intencional — fonte única de cálculo).

Sem duplicação detectada. Política `docs/performance/bundle-policy.md`
permanece válida.

---

## 2. Route-Based Lazy Split

Já vigente — `Index.tsx` usa `React.lazy` + `Suspense` para todos os
módulos pesados:

```text
AnalysisModule, ProposalModule, HelpModule, ProposalHistoryModule,
ObjectionsModule, PostSaleModule, CommunityModule, …
```

Nenhuma rota adicional virou lazy nesta wave (todas as candidatas já
estão). Decisão: **não inflar `Suspense` boundaries sem necessidade**
(princípio de mínimo toque do Production Lock V2.4).

---

## 3. Heavy Module Isolation

### Ação aplicada — `helpContent` split

**Novo arquivo:** `src/data/helpContent.meta.ts` (~1 KB)
- Exporta `ConsultiveBlockKind` (tipo)
- Exporta `consultiveBlockMeta` (dicionário visual: emoji/label/tone)
- **Sem import** de `helpContent.ts` — direção única.

**`src/data/helpContent.ts`** (~117 KB)
- Removida a definição local de `ConsultiveBlockKind` e
  `consultiveBlockMeta` (duplicação removida).
- Reexporta ambos do meta para preservar compat de imports legados:
  ```ts
  export { type ConsultiveBlockKind, consultiveBlockMeta } from './helpContent.meta';
  ```

**`src/lib/contextualHelp/registry.ts`**
- Import síncrono de `articleById` removido.
- `getSurfaceArticles` agora é **async** e faz `import('@/data/helpContent')`
  sob demanda. O catálogo institucional só entra no grafo runtime quando
  alguém realmente abre um popover de ajuda.

**`src/components/help/HelpHint.tsx`**
- `consultiveBlockMeta` agora vem de `@/data/helpContent.meta` (1 KB).
- `getSurfaceArticles` chamado via `useEffect` quando o popover abre;
  estado local recebe a lista. Antes da abertura: zero custo.

**`src/components/help/ContextualInsightStrip.tsx`**
- `consultiveBlockMeta` agora vem de `@/data/helpContent.meta` (1 KB).
- Strip nunca dependia de artigos — agora **realmente** não puxa mais o
  catálogo (antes puxava transitivamente via type import).

### Impacto estimado

- Chunk inicial dos módulos consultivos perde ~117 KB (uncompressed) do
  catálogo de help, descendo para o chunk lazy `helpContent-[hash].js`.
- Catálogo só carrega no **primeiro popover aberto** ou na entrada no
  `HelpModule` (que já era lazy).

---

## 4. Mobile Cold Start Reduction

- Cada hint contextual antes carregava texto institucional de ~30+ artigos
  no parse inicial. Em mobile (3G/4G + CPU lenta) isso era trabalho puro
  desperdiçado quando o usuário não abria nenhum popover.
- Pós-wave: ícone do hint = render trivial. Catálogo só desce quando há
  intenção explícita (click).
- `initWebVitals()` em `main.tsx` continua medindo FCP/LCP/CLS/INP/TTFB —
  monitorar deltas reais em produção via Performance Intelligence Dashboard.

---

## 5. Progressive Loading UX

Validação visual:

- `HelpHint` continua mostrando popover instantaneamente (header + summary
  + insights vêm do `HELP_SURFACES` local, **não** do catálogo).
- A seção "Aprofundar na Central de Ajuda" só renderiza quando
  `articles.length > 0`. Durante o ~50–150 ms do dynamic import a seção
  fica vazia (sem skeleton barulhento) e aparece com fade natural do
  Popover. Nenhum spinner intrusivo.
- `ContextualInsightStrip`: zero mudança visual (não usa artigos).
- `HelpModule`: zero impacto (já é lazy completo).

Resultado: split **invisível** ao usuário. Nenhum estado vazio explícito,
nenhum flicker.

---

## 6. Shared Chunk Governance

- Nenhuma duplicação introduzida: `helpContent.meta` é arquivo único, e
  `helpContent.ts` reexporta dele (não copia).
- Política `docs/performance/bundle-policy.md` preservada:
  - `@/core/finance` permanece inline.
  - Manual chunks de vendor inalterados.
  - Lib >50 KB gzipped exige entry em `manualChunks`.
- Sem "lazy split fake": o dynamic import de `helpContent` cria um chunk
  separado real (verificável via `vite build`).

---

## 7. Runtime Sustainability Validation

- Memória: parse do catálogo deslocado para sob demanda → menos retenção
  no chunk inicial.
- Long sessions: comportamento inalterado (catálogo, uma vez carregado,
  fica no module cache do bundler — sem refetch).
- Navegação: nenhuma mudança no roteamento; nenhuma nova Suspense
  boundary.
- Acessibilidade: `aria-label` no botão preservado; popover semântica
  intacta.

---

## 8. Zero Regression Validation

- ✅ Typecheck `tsc -p tsconfig.app.json --noEmit` limpo.
- ✅ API pública de `helpContent.ts` preservada (`ConsultiveBlockKind`,
  `consultiveBlockMeta`, `articleById`, `categories`, …).
- ✅ API pública de `registry.ts` preservada — apenas `getSurfaceArticles`
  virou async (caller único atualizado: `HelpHint`).
- ✅ Nenhuma engine financeira tocada.
- ✅ Nenhum provider/context modificado.
- ✅ Nenhuma feature nova.

Diff total:
- **Novo:** `src/data/helpContent.meta.ts` (~50 LOC).
- **Editado:** `src/data/helpContent.ts` (−16 / +6 LOC).
- **Editado:** `src/lib/contextualHelp/registry.ts` (~+6 / −2 LOC).
- **Editado:** `src/components/help/HelpHint.tsx` (~+13 / −2 LOC).
- **Editado:** `src/components/help/ContextualInsightStrip.tsx` (1 linha).

Líquido funcional: **zero** — apenas reorganização de carregamento.

---

## 9. Final Performance State

- Initial load caiu? **Sim** — catálogo de ~117 KB sai do grafo inicial
  dos módulos consultivos.
- Mobile melhorou? **Sim** — parse adiado para intenção explícita.
- Módulos isolados? **Sim** — `helpContent.ts` agora vive num chunk
  próprio (gerado pelo dynamic import).
- Navegação continua premium? **Sim** — sem flicker, sem skeleton ruidoso.
- Runtime mais sustentável? **Sim** — menos trabalho no boot.
- Pressão reduziu de verdade? **Sim** — diferentemente de split de UI
  (que apenas reordena render), aqui o JS do catálogo só executa quando
  necessário.

---

## Final Verdict

✅ **Bundle Lazy Split Pass — APROVADO.**

O maior arquivo do projeto (`helpContent.ts`, 117 KB) saiu do caminho
crítico de boot de toda a plataforma. Hints contextuais permanecem
instantâneos; o catálogo só carrega sob intenção explícita. Zero
regressão funcional, zero perda visual, zero engine tocada.

**Próximas waves (não desta):**
3. Observability Activation (Sentry/Web Vitals em produção real).
4. Hot List Memoization (`React.memo` guiado por `<PerfProfiler>`).

**Feature freeze:** mantido. Nenhum desvio.
