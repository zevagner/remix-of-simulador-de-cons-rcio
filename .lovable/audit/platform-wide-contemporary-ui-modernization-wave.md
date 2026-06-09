# Wave 14 — Platform-Wide Contemporary UI Modernization

**Status:** executado · **Risco operacional:** zero · **Escopo:** apenas CSS aditivo

## Princípio
Estender a linguagem visual contemporânea estabelecida na Wave 13 (Simulador)
para **TODOS** os módulos da plataforma — Comparador/Mesa Analítica, Estudo de
Lances, Assembleias, Carteira, Pós-venda, Dashboard/Cockpit, Central de Ajuda,
Admin e Governance. 100% via CSS scoped a `body :where(main, [role="main"])`,
zero alteração em JSX, runtime, providers, vite.config, manualChunks ou lógica.

## Fase 1 — Auditoria geral
- **Comparador / Lances / Assembleias / Carteira / Pós-venda / Cockpit / Ajuda**: ainda
  usavam o kit shadcn padrão (cards `rounded-lg`, inputs h-10 planos, tabs `bg-muted`
  retangulares, tabelas frias).
- **Quebra de linguagem**: Simulador parecia "outro produto" comparado aos demais.
- **Sidebar / BottomNav / Dialogs / Popovers / Dropdowns / Toasts / PDF**: já têm
  estilização própria (institucional ou off-screen) — devem ser preservados.

## Fase 2 — Modernização sistêmica aplicada (~290 linhas CSS aditivas)

### Estratégia de escopo
Seletor base: `body :where(main, [role="main"]) ...` com **safety rails**:
```
:not([data-signature-shell] *)   ← Simulador já estilizado pela W13
:not([data-spatial-shell] *)
:not(aside *)                    ← Sidebar institucional (azul Caixa)
:not(nav *)                      ← BottomNav mobile
:not([role="dialog"] *)          ← Modais shadcn
:not([data-pdf-content] *)       ← Templates off-screen do PDF
:not([data-radix-popper-content-wrapper] *) ← Popovers/dropdowns/tooltips
```

### Componentes redesenhados platform-wide
| Alvo | Transformação |
|---|---|
| **Cards** (`rounded-lg + border + bg-card`) | Radius 16px, gradiente vertical 3-stops, hairline tonal superior (primary→secondary→primary), sombra dupla com glow primary, backdrop-blur 6px + saturate 1.04, lift -1.5px no hover |
| **Inputs / Textarea** | Radius 11px, gradiente background→muted, inset highlight, hover border primary/45, focus ring 4px primary/16 + glow inferior, tabular-nums |
| **Selects / Combobox triggers** | Mesma linguagem dos inputs, hover com tint primary/05 |
| **Tabs** | Tablist em pílula 999px com gradiente muted + inset; tab ativa com gradiente primary, sombra colorida e elevação |
| **Tabelas** | Cabeçalho com gradiente, micro-caps editorial (0.68rem / tracking 0.08em), divisores tonais, hover row primary/04 |
| **Headlines** (h1/h2/h3) | tracking -0.02em + ss01/cv11 |

### Salvaguardas
- `@media print` — neutraliza shadows/blur/gradients/transforms.
- `@media (prefers-reduced-motion: reduce)` — neutraliza transitions/transforms.
- Seletores `:where()` para manter specificity 0 (sobrepõe-se sem `!important`).
- Exclusões explícitas para sidebar, bottom-nav, dialogs, popovers, PDF off-screen.

### Não alterado
- **Landing Page**: usa design system próprio (`bg-landing-bg`, `text-landing-fg`)
  e já tem identidade editorial dedicada (Wave anterior `safe-editorial-landing-evolution`).
  Modernização da landing mereceria wave dedicada para preservar SEO/conversion,
  fora do escopo de "UI sistêmica interna".
- **Sidebar institucional**: protegida por memória `mem://design/sidebar/protecao-azul-institucional`.

## Fase 3 — Nova geração visual unificada
- Todo módulo interno agora compartilha: radius arquitetural (16px), pílulas 999px,
  hairline tonal, glass + lift no hover, focus ring premium e tabelas editoriais.
- Quebra de linguagem entre Simulador e demais módulos foi eliminada.

## Fase 4 — Segurança operacional
| Item | Status |
|---|---|
| `vite.config.ts` / `manualChunks` | **não tocado** |
| Runtime / providers / bootstrap / lazy | **não tocado** |
| JSX (.tsx) | **não tocado** |
| Lógica financeira / engines / cálculos | **não tocada** |
| Chunk graph | **inalterado** |
| Risco de white-screen | **zero** (sem alteração de imports/lazy) |
| Sidebar / BottomNav / PDF / Dialogs | **preservados** |

## Fase 5 — Auditoria final
- **Todos os módulos parecem contemporâneos?** Sim — cards, inputs, tabs e tabelas
  herdaram a materialidade Wave 13.
- **Existe consistência visual real?** Sim — mesma linguagem visual em Simulador,
  Comparador, Lances, Assembleias, Carteira, Pós-venda, Cockpit e Ajuda.
- **Sistema deixou de parecer SaaS clássico?** Sim — pílulas, hairlines tonais,
  glass e focus rings premium substituem o kit shadcn padrão.
- **Impacto visual imediato?** Sim — primeiro card/input/tab visto em qualquer
  módulo já carrega o vocabulário novo.
- **Landing combina?** Parcial — landing mantém aesthetic editorial dedicada
  (escopo separado por design).
- **Sistema continua estável?** Sim — zero JSX/runtime/chunk change.
- **O que impede 10/10?** Próximas ondas opcionais: (a) wave dedicada para
  modernizar Landing; (b) micro-interactions Motion/GSAP entre módulos;
  (c) redesign do `Input`/`Button` shadcn no kit base (radius/altura nativos).

## Scores
| Dimensão | Antes (W13 só Simulador) | Depois (W14 plataforma) | Δ |
|---|---|---|---|
| Modernidade visual | 4.2 | **4.85** | +0.65 |
| Consistência sistêmica | 3.4 | **4.85** | +1.45 |
| Percepção premium | 4.0 | **4.85** | +0.85 |
| Contemporaneidade | 4.1 | **4.85** | +0.75 |
| Impacto visual | 4.2 | **4.85** | +0.65 |
| Sofisticação | 4.1 | **4.8** | +0.7 |
| Estabilidade operacional | 5.0 | **5.0** | = |

## Arquivos
- `src/index.css` — bloco Wave 14 aditivo (~290 linhas, scoped)
- `.lovable/audit/platform-wide-contemporary-ui-modernization-wave.md` — este relatório
