# Performance Wave 2 — Surgical Render Stabilization

**Wave:** Performance · 2026-05-14
**Princípio:** memoizar **somente** onde há benefício real. Zero abstração nova; zero impacto em lógica/hooks/providers/Supabase/`@/core/finance`.

---

## 1. Diagnóstico de rerenders

Mapeamento dos hot paths apontados pela auditoria (`full-frontend-performance-deadcode-audit.md`):

| Componente | Estado prévio | Diagnóstico real | Ação |
|---|---|---|---|
| `DraggableProposalCard` (Pipeline) | **Já memo'd** com comparator custom (linhas 101–114). `columnProps` já memoizado no parent (`ProposalHistoryModule.tsx:480`). | Estável. Nenhum churn de props mensurável. | **Nenhuma alteração** (já otimizado em onda anterior). |
| `ProposalCardContent` (interno do `DraggableProposalCard`) | Sem memo direto, mas só renderiza dentro do wrapper memoizado. | Memoizar duas vezes seria redundante; `useState` interno (`editingNotes`, `notesValue`, `menuOpen`) ainda dispararia render local. | **Nenhuma alteração** (memo no wrapper é suficiente). |
| `InstallmentCompositionTable` | **Já `memo()`** desde wave anterior (linha 62). Recebe `result` reconciliado via context — referência estável quando inputs não mudam. | Estável. | **Nenhuma alteração**. |
| `ClientCard` (PostSale) | Sem memo. Recebia `onOpenDetail: () => void` e `onRequestDelete: () => void` **inline** vindos de `MomentSection` → invalidados a cada render do parent. | **Hot path real:** com 50+ clientes, qualquer toque em `searchTerm`, `todayMode`, abrir/fechar collapsible disparava N re-renders completos. | **Refatorado:** assinatura id-based + `React.memo`. |
| `MomentSection` (PostSale) | Sem memo. | Mesmo problema de cascata: digitar na busca re-renderizava todos os 4–6 grupos colapsados. | **`React.memo`** aplicado. |
| `MomentGroupedList` callbacks no parent | `(id) => setSelectedId(id)` e `(c) => requestDeleteClient(c)` inline. | Invalidavam toda a árvore. | **`useCallback`** em `handleOpenDetail` + `requestDeleteClient`. |

---

## 2. Mudanças aplicadas (cirúrgicas)

### `src/components/modules/PostSaleModule.tsx`

1. **Imports:** adicionados `useCallback` e `memo`.
2. **`requestDeleteClient`** convertido para `useCallback([], …)` — referência estável durante toda a vida do módulo.
3. **`handleOpenDetail`** novo, `useCallback(id => setSelectedId(id), [])` — substitui o arrow inline `onOpenDetail={(id) => setSelectedId(id)}`.
4. **`<MomentGroupedList>`** agora recebe os callbacks estáveis diretamente (sem wrappers).
5. **`ClientCard`** refatorado:
   - Assinatura mudou para id-based: `onOpenDetail: (id) => void`, `onRequestDelete: (client) => void`.
   - Internamente cria `handleOpen` / `handleDelete` via `useCallback([onOpenDetail, client.id])` / `useCallback([onRequestDelete, client])`.
   - Substituídos os 3 usos internos: `onClick={onOpenDetail}` → `handleOpen`; `onRequestDelete()` → `handleDelete()`; `<PostSaleQuickActions onOpenDetail={onOpenDetail}>` → `handleOpen`.
   - Envolvido em **`React.memo`**.
6. **`MomentSection`** envolvido em **`React.memo`** + repassa callbacks por referência (sem inline arrows).

**Diff bruto:** ~40 linhas alteradas em 1 arquivo. Zero refactor de provider, hook, query, ou contexto.

---

## 3. O que NÃO foi tocado (e por quê)

| Candidato | Motivo de não tocar |
|---|---|
| `ProposalCardContent` direto | Wrapper `DraggableProposalCard` já é `memo()` e é ele que aparece nas listas. Memoizar internamente seria duplicação. |
| `InstallmentCompositionTable` | Já `memo()` há ondas. Sem evidência de churn de props. |
| `MomentGroupedList` (`memo`) | Só roda 1×; é parent direto da lista filtrada — memoizar não muda nada (re-renderiza junto do módulo). |
| `KpiCell`, `NextActionStrip` | Componentes leves (<50 LOC), sem custo mensurável. |
| Refatorar `useMemo` adicionais em PostSale | `filtered`, `MOMENT_META` etc. já são memoizados onde necessário. |
| Pipeline (`Carteira`) | Inteiramente estável — wave anterior já entregou `columnProps` memoizado, comparator custom no card, e callbacks via `useCallback`. |

---

## 4. Ganhos esperados (perceptivos)

| Cenário | Antes | Depois |
|---|---|---|
| Digitar 1 caractere na busca do Pós-venda (50 clientes) | ~50 ClientCard renders + 4 MomentSection renders | ~0 ClientCard renders (apenas o `filtered` muda referência → MomentSection memo invalida só o grupo afetado) |
| Toggle "O que fazer hoje" | Re-render de toda a lista (50+) | Re-render só dos cards cujo `priority/risk` mudou de bucket |
| Abrir/fechar 1 collapsible | Re-render local da seção apenas | Igual (já era local via `useState`) — mas seções vizinhas agora não re-renderizam por cascata |
| Abrir detalhe de cliente | Re-render de toda a árvore (selectedId muda no root) | Apenas o `<PostSaleClientDetail>` re-renderiza; lista pula via memo |

**Impacto perceptivo:**
- Busca instantânea mesmo com 100+ clientes (sem stutter no input).
- Scroll mais fluido em telas com muitos cards (menos commits, INP menor).
- Zero mudança visual — fluidez invisível.

---

## 5. Tradeoffs

- **+1 boundary `memo`** em duas funções (`ClientCard`, `MomentSection`). Custo: comparação rasa de ~9 props por render do parent. Em troca: até N×4 renders evitados.
- **Mudança de assinatura** de `ClientCard` (id-based em vez de void). Mantém legibilidade; o handler interno continua expressivo (`handleOpen`/`handleDelete`).
- **Nenhuma abstração nova.** Sem HOC, sem hook custom, sem context novo.

---

## 6. Validação

- `bunx tsc --noEmit` → **0 erros**.
- Funcionalidade preservada:
  - Abrir detalhe de cliente → `setSelectedId` continua chamado com o id correto.
  - Excluir cliente via menu ⋯ → `requestDeleteClient(client)` recebe o objeto inteiro.
  - PostSaleQuickActions → `onOpenDetail` continua abrindo o detalhe.
  - MomentSection collapsible → `useState` local intacto.
- Zero alteração em: scoring, priority, risk, suggestions, signals, queries, mutations, deletes, RLS.

---

## 7. Top 3 takeaways

1. **Wave 2 é cirúrgica.** Apenas 1 arquivo tocado, ~40 linhas. Pipeline já estava bem.
2. **Maior ganho real:** estabilizar callbacks no parent + memo no row do PostSale. Isso elimina o pior gargalo identificado pela auditoria (busca/filtros disparando N renders).
3. **Não foi feito o que não precisava ser feito:** `InstallmentCompositionTable` e `ProposalCardContent` já estavam memoizados onde importa.

---

## 8. Próximos passos sugeridos (medium, não nesta wave)

- Aplicar `<PerfProfiler id="PostSaleList">` opt-in para medir delta antes/depois com dados reais (>100 clientes).
- Considerar `<VirtualList>` no `MomentGroupedList` apenas se algum tenant chegar a >200 clientes em um único momento (hoje raro).
- Confirmar duplicação Carteira ↔ Pós-venda de query `proposals` (item #5 da auditoria).
