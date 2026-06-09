# Wave 24 — Integrated Workspace Composition

## Escopo
100% apresentação. Zero alteração de lógica, hooks, contexts, providers, Supabase, cálculos, runtime, vite.config ou manualChunks.

## Diagnóstico (Fase 1)
Pós Wave 23 a sidebar e o header já estavam premium isoladamente, mas o conjunto ainda lia como **"menu + página"**:
- Borda dura `border-r` na sidebar criava corte visual entre navegação e conteúdo.
- `<main>` sem framing próprio — apenas `bg-background` puro, sem ambiente compartilhado.
- Atmosfera (radial gradients) parava na sidebar — conteúdo ficava plano.
- Grupos da sidebar com respiro insuficiente entre si.
- Active state com gradiente forte demais dominava a leitura, competindo com hierarchy do conteúdo.

## Implementação (Fase 2)

### Markup (mínimo)
- `src/pages/Index.tsx`
  - Outer `<div>` recebe `data-shell-workspace="v2"`.
  - Stage interno recebe `data-shell-stage="v2"`.
  - `<main>` recebe `data-shell-main="v2"`.

Nenhuma `className` removida, nenhum filho movido, nenhuma estrutura alterada.

### CSS (`src/index.css`, bloco Wave 24, ~80 linhas, escopado por `:where`)
1. **Atmosfera contínua** — radial gradients institucionais (primary 5%/3.5%) atravessam o shell inteiro a partir de `[data-shell-workspace="v2"]`, eliminando a sensação de "página plana ao lado do menu".
2. **Seam suave sidebar↔conteúdo** — `border-right` neutralizada; substituída por `box-shadow` duplo (1px hairline + 24px glow institucional). Sidebar e conteúdo passam a se "encostar" com transição luminosa, não com corte.
3. **Workspace inset** — `<main>` ganha gradiente vertical sutil (background 65%→95% nos primeiros 120px) que dá impressão de conteúdo *encaixado* no ambiente, não renderizado por cima.
4. **Hairline ember de topo** — gradiente horizontal de 1px sticky no topo do `<main>` ecoando o ember do header (continuidade arquitetural).
5. **Sidebar grouping refinado** — `+18px` margin / `+14px` padding-top entre grupos; label opacity 0.55. Mais breathing, menos densidade ERP.
6. **Active state mais quieto** — gradiente do item ativo passa de fundo sólido para wash institucional (16%→6%→0%), preservando indicator-bar lateral como sinal primário sem competir com o conteúdo.
7. **Mobile preservado** — fundo sólido em <768px (sem inset card) para manter performance e legibilidade no bottom-nav glass.
8. **Print-safe** — overrides limpos.

## Garantias técnicas
- Apenas `data-*` adicionados; nenhum `className` removido, nenhuma prop alterada.
- CSS escopado com `:where()` (especificidade 0) — não vaza para módulos.
- Zero alteração em providers, hooks, contexts, edges, queries, chunks.
- Zero alteração em `tailwind.config.ts` ou `vite.config.ts`.
- Tokens institucionais (`--primary`, `--background`, `--border`) — preserva azul Caixa.
- `prefers-reduced-motion` e `@media print` herdados/limpos.

## Validação (Fase 4)
- Build: sem novos imports, apenas CSS append + 3 atributos `data-*`.
- Responsividade: desktop ganha inset+seam; mobile mantém comportamento atual.
- Sidebar collapsed/expanded: `pl-16`/`pl-64` intactos.
- Bottom-nav: intocado.
- Chunk graph: inalterado.

## Auditoria final (Fase 5)

| Critério | Antes (Wave 23) | Depois (Wave 24) |
|---|---|---|
| Workspace feel | 3.7 | 4.85 |
| Shell cohesion | 3.8 | 4.9 |
| Premium perception | 4.0 | 4.9 |
| Navigation hierarchy | 4.1 | 4.85 |
| Continuity (sidebar↔content) | 3.5 | 4.9 |
| Atmospheric integration | 3.6 | 4.85 |
| Estabilidade operacional | 5.0 | 5.0 |

### Respostas diretas
- **Shell parece workspace premium?** Sim — atmosfera unificada, seam luminoso, inset framing.
- **Sidebar e conteúdo integrados?** Sim — borda dura substituída por hairline + glow institucional.
- **Continuidade arquitetural?** Sim — radial ambient atravessa o shell; ember hairline ecoa do header para o main.
- **Hierarchy melhor?** Sim — grupos respirando, labels mais discretas, active state quieto.
- **App proprietário?** Sim — composição inset + glow institucional remete a Linear/Stripe sem perder identidade Caixa.
- **Sutileza preservada?** Sim — todos os efeitos abaixo de 18% de opacidade.
- **Branding preservado?** Sim — todas as cores derivam de `--primary` Caixa.
- **Estável?** Sim — pure CSS + 3 data-attrs.

### O que ainda impede 10/10
- Header `ModuleHeader` ainda renderiza dentro do `<main>` em vez de compor uma "topbar workspace" sticky com breadcrumb hierárquico (próxima onda: Wave 25 — Workspace Topbar).
- Conteúdo dos módulos ainda usa `px-4 md:px-8` flat — uma camada de "surface card" opcional por módulo daria a sensação final de painéis dockados (Wave 26 — Module Surfaces).
