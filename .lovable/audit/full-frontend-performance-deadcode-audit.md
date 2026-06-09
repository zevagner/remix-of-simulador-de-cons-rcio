# Full Frontend Performance & Dead Code Audit

**Wave:** Frontend Performance & Dead Code · 2026-05-14
**Modo:** auditoria read-only (zero refactor neste passo)
**Princípio absoluto:** impacto real percebido > micro-otimização. Nada de quebrar lógica financeira, IA, providers, hooks críticos ou Supabase.

---

## 0. Snapshot quantitativo

| Métrica | Valor |
|---|---|
| Arquivos `.ts` / `.tsx` em `src/` | **494** |
| LOC total `src/` | ~79.4k (sem `types.ts` gerado: ~77.7k) |
| `src/components/` | 2.1 MB |
| `src/services/` | 222 KB · `src/utils/` 287 KB · `src/hooks/` 132 KB |
| Maior arquivo de domínio | `PostSaleModule.tsx` (854 LOC), `InvestmentModule.tsx` (789), `SimulatorContext.tsx` (776), `ProposalHistoryModule.tsx` (775) |
| Arquivo gerado mais pesado | `src/integrations/supabase/types.ts` (1691 LOC — não tocar) |
| `lucide-react` imports | **171** (todos nomeados — tree-shaking OK) |
| `framer-motion` imports | **3** arquivos (LandingPage + SwipeableModule + governance metadata) |
| `recharts` consumers | 10 telas (todas em rotas lazy) |
| Dependências top (node_modules) | lucide 29M · exceljs 23M · sentry 11M · supabase 6.5M · framer 4.7M · recharts 4.6M · tanstack 3.5M · radix 3M |
| Lazy routes | 8 páginas + 8 módulos + sub-tabs ✓ |
| Manual chunks | 9 vendors ativos (`vite.config.ts`) ✓ |
| Web Vitals + PerfProfiler + VirtualList | Implementados, opt-in ✓ |
| `console.log/info/warn` em runtime | **7** ocorrências (residual baixo) |

**Veredito macro:** o frontend está em **bom estado estrutural**. As ondas anteriores (Performance Hardening, Runtime Policy, Bundle Policy, Tour Removal) já cobriram o grosso. O que sobrou é **fino**: alguns órfãos pequenos, ausência de instrumentação ativa, e potencial de virtualização/memoização sob evidência.

---

## FASE 1 — Dead Code Audit

### 1.1 Componentes órfãos confirmados

Varredura por usos (`rg "@/components/ui/<nome>"`):

| Arquivo | LOC | Status | Ação sugerida |
|---|---|---|---|
| `src/components/ui/chart.tsx` | 306 | **ÓRFÃO** — nenhum import em `src/` | **Remover** (Recharts é usado direto pelos consumers; o wrapper shadcn não está em uso) |
| `src/components/ui/result-card.tsx` | 30 | **ÓRFÃO** — nenhum import | **Remover** |
| `src/utils/index.ts` | 33 | Barrel não importado | Manter (arquivo de fachada, baixo custo) ou validar 1 a 1 |

**Impacto:** ~336 LOC + bloco de tipos `recharts`. Remover `chart.tsx` reduz 1 caminho potencial para o bundle (mesmo lazy). Risco zero (zero referências).

### 1.2 Módulos e hooks

- Todos os `*Module.tsx` em `src/components/modules/` estão referenciados em `src/pages/Index.tsx` via `lazy()`. **Zero módulos órfãos.**
- Todos os hooks em `src/hooks/` têm consumers. **Zero hooks órfãos.**
- Todos os services em `src/services/` têm consumers. **Zero services órfãos.**

### 1.3 Resíduos de features removidas

| Feature | Status |
|---|---|
| Tour Guiado (intro.js) | **100% removido** (ver `guided-tour-full-removal-audit-wave.md`). Zero hits para `introjs/tourHelper/GuidedTour/useOnboarding/vendor-tour`. |
| PWA / Service Worker | Removido em `main.tsx` com cleanup ativo (unregister + caches.delete). Resíduo: pode-se considerar remover este bloco em ~12 meses quando a base de instalações antigas tiver migrado. **Manter por enquanto.** |
| Onboarding interativo | Não há resíduo (apenas `HelpModule` estático). |

### 1.4 Imports / libs parcialmente usadas

| Lib | Uso | Avaliação |
|---|---|---|
| `framer-motion` (4.7 MB node_modules, ~120 KB bundle) | **3 arquivos** apenas (`LandingPage`, `SwipeableModule`, governance metadata) | **Candidato #1 a redução**: substituir por CSS transitions / View Transitions API ou por `motion` (lib mais leve, ~30 KB). Já está em chunk próprio (`vendor-motion`), então só carrega quando usado — impacto real só na Landing. |
| `exceljs` (23 MB node_modules) | Apenas parser de assembleias admin | OK — chunk dedicado `vendor-excel`, lazy. |
| `react-markdown` | Surfaces específicas | OK — chunk dedicado. |
| `@dnd-kit` | Apenas Kanban CRM | OK — chunk dedicado, lazy. |
| `@sentry/react` | Observabilidade opt-in via `VITE_SENTRY_DSN` | OK — chunk dedicado. **Verificar se DSN está configurada em produção** (caso contrário, o init faz no-op mas o JS ainda baixa quando alguma rota referencia). |
| `lucide-react` | 171 imports nomeados | OK — tree-shake limpo. |

### 1.5 CSS morto

- `index.css` já passou por cleanup do Tour Guiado.
- 14 arquivos usam `backdrop-blur`. Em ambientes corporativos / Citrix, `backdrop-filter` é caro (composite layer). Avaliar substituir por `bg-background/95` puro nas surfaces non-crítical (modais OK; sticky headers e cards de lista — ruim).

---

## FASE 2 — Performance Audit

### 2.1 Re-renders e memoização

- **39 ocorrências** de `useMemo`/`useCallback` em `simulator/` + `InvestmentModule.tsx` — alinhado à política (memo só onde há custo real).
- **Zero `React.memo`** em componentes de domínio. Para a maioria está OK (re-render é barato), mas há candidatos óbvios:
  - `ProposalCardContent` (662 LOC, lista de Carteira) — re-renderiza ao menor toque no parent.
  - `InstallmentCompositionTable` (515 LOC, tabela com muitas linhas).
  - `MomentSection` rows do `PostSaleModule`.

  **Custo:** baixo. **Risco:** baixo. **Impacto:** médio (Carteira > 50 propostas).

- Context split já feito (`SimulatorContext` input/result; `Investment` paths; `SelectedGroup`; `BidsStudy`; `InvestmentResults`). ✓

### 2.2 React Query / cache

- `App.tsx` define defaults conservadores (`staleTime: 60s`, `gcTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`). ✓
- StaleTime escalonado por hook (30s pós-venda, 60s admin, 2min/5min para listas estáveis). ✓
- **Suspeita pendente (não confirmada):** Carteira ↔ Pós-venda parecem buscar `proposals` separadamente. Antes de unificar, **medir Network panel** (mesma chave evita request duplicado por padrão). Se forem chaves diferentes para o mesmo filtro, consolidar via hook compartilhado.
- Sem evidência de waterfall ou refetch storm.

### 2.3 Bundle size

- 9 manual chunks ativos (`vendor-react/supabase/query/radix/excel/motion/sentry/dnd/markdown`). ✓
- **Recharts NÃO está em manualChunks** por decisão consciente (ciclos d3/victory-vendor causavam TDZ). Comentário documentado em `vite.config.ts`. ✓ — não tocar.
- **Falta CI gate** de tamanho de chunk. Roadmap mantido.

### 2.4 Routing

- 100% das páginas e módulos via `React.lazy`. ✓
- `<Suspense>` com `<Loader />` consistente. ✓
- **Sem `<link rel="prefetch">`** para a próxima rota provável (Index após login). Quick win possível: prefetchar `Index` chunk no LoginPage.

### 2.5 Simulador

- `SimulatorContext.tsx` (776 LOC) já está splitado em providers de input/result.
- `calculateSimulation` é orquestrador puro sobre `@/core/finance` — engine canônica intacta. ✓
- Sem evidência de cálculos em render (todos via `useMemo` com deps estáveis ou em selectors).

### 2.6 Gráficos e tabelas

- `VirtualList` existe (`@/components/perf/VirtualList`) mas **só é usado em testes/governance** — nenhum consumer real ainda.
- **Candidatos confirmados:**
  1. `InstallmentCompositionTable` em prazos ≥ 200 meses.
  2. Carteira (`ProposalHistoryModule`) > 200 propostas.
  3. Comunidade feed.
  4. Pós-venda `MomentGroupedList` quando há muitos clientes.

  Aplicar **somente sob evidência** (Profiler ou queixa real).

### 2.7 Motion / CSS

- 14 usos de `backdrop-blur` — mapear quais estão em hot paths (sticky headers, mobile bottom nav).
- `framer-motion` apenas na Landing — Landing é cold-path; impacto baixo.

### 2.8 Memória

- `main.tsx` já desregistra Service Workers e limpa caches. ✓
- Não foram detectados listeners `addEventListener` sem cleanup em sweep rápido (precisaria revisão dedicada por arquivo para certificar).

---

## FASE 3 — Perceived Performance

### 3.1 Sinais positivos
- Lazy + Suspense maduros → first paint rápido.
- Manual chunks → cache estável entre deploys.
- Web Vitals instrumentados → dado real disponível quando Sentry DSN está ativa.

### 3.2 Sinais a observar (sem evidência ainda — exigem medição)
- **Cold start Landing:** carrega `framer-motion` (vendor-motion ~120 KB) só para 2 efeitos.
- **Login → Index:** sem prefetch — usuário vê Loader extra.
- **Backdrop-blur** em sticky headers pode causar jank em scroll mobile/Citrix.

---

## FASE 4 — Top 10 Melhorias (ranqueadas por impacto real × risco)

| # | Melhoria | Impacto | Esforço | Risco | Tipo |
|---|---|---|---|---|---|
| 1 | **Remover `chart.tsx` + `result-card.tsx`** órfãos | Baixo–Médio (limpa árvore, ~336 LOC) | Trivial | **Zero** | Quick win |
| 2 | **Prefetch chunk `Index` no LoginPage** (`<link rel="modulepreload">` ou import dinâmico ao montar) | Médio (TTI pós-login -200~400ms) | Baixo | Baixo | Quick win |
| 3 | **Substituir `framer-motion` por CSS / View Transitions** na Landing | Médio (vendor-motion deixa de existir; -120 KB) | Médio | Baixo | Medium |
| 4 | **Memoizar `ProposalCardContent` + `InstallmentCompositionTable` + `MomentSection` row** | Médio (Carteira/Schedule > 100 itens) | Baixo | Baixo | Quick win |
| 5 | **Confirmar duplicação Carteira ↔ Pós-venda** via Network panel; consolidar query key se confirmado | Médio (1 req a menos por navegação) | Baixo | Baixo | Quick win |
| 6 | **Aplicar `<VirtualList>` em `InstallmentCompositionTable`** quando prazo ≥ 200 | Alto em hot path | Médio | Médio (validar Cmd+F, sticky header) | Medium |
| 7 | **Auditar e podar `backdrop-blur`** em sticky/scroll surfaces (manter em modais) | Médio em Citrix/mobile | Baixo | Baixo | Quick win |
| 8 | **Ativar instrumentação Web Vitals** em produção (configurar `VITE_SENTRY_DSN`) e abrir o painel admin "Performance Intel" | Alto (passa de "achismo" para dado) | Trivial | Zero | Quick win |
| 9 | **CI bundle gate** (size baseline em `dist/assets/*.js` por chunk) | Médio (previne regressão futura) | Médio | Baixo | Structural |
| 10 | **Limpar 7 `console.log/info/warn`** restantes em runtime (manter `logger.*`) | Baixo (ruído) | Trivial | Zero | Quick win |

---

## Scores

| Dimensão | Score | Observação |
|---|---|---|
| **Frontend health** | **8.5 / 10** | Estrutura sólida, dead code mínimo |
| **Performance (real)** | **8 / 10** | Boa base; falta evidência ativa |
| **Scalability** | **8 / 10** | Lazy + chunks maduros; falta virtualização aplicada |
| **Bundle efficiency** | **8.5 / 10** | 9 manual chunks; falta CI gate; framer pesa na Landing |
| **Runtime efficiency** | **7.5 / 10** | Memoização seletiva; faltam `React.memo` em hot lists |
| **Perceived performance** | **7.5 / 10** | Lazy bom; falta prefetch pós-login; backdrop-blur a rever |
| **Maintainability** | **9 / 10** | Fachadas canônicas, governance ativa |
| **Technical debt** | **2 / 10** (10 = pior) | Muito baixo após ondas anteriores |

**Score consolidado:** **8.0 / 10**.

---

## Plano executivo

### Quick wins (executar em wave dedicada — risco zero)
1. Deletar `chart.tsx` e `result-card.tsx`.
2. Memoizar 3 componentes de hot list.
3. Limpar 7 `console.*`.
4. Adicionar prefetch de `Index` no LoginPage.
5. Auditar `backdrop-blur` (manter modais, podar sticky).

### Medium changes (com QA dedicado)
6. Aplicar `<VirtualList>` em `InstallmentCompositionTable` (≥200) — validar Cmd+F + sticky header.
7. Confirmar duplicação Carteira ↔ Pós-venda e consolidar.
8. Substituir `framer-motion` na Landing por CSS / View Transitions.

### Structural optimizations
9. CI bundle size gate.
10. Ativar Sentry DSN em prod e instituir review semanal de Web Vitals via painel "Performance Intel".

---

## Garantias respeitadas
- Zero alteração de código nesta wave (apenas auditoria).
- Nenhuma sugestão toca: `@/core/finance`, hooks de cálculo, providers, Supabase, edges, IA, Sidebar, design tokens, RLS.
- Toda sugestão classificada por impacto × risco; nenhuma é micro-otimização especulativa.
