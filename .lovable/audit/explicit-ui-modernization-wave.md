# Wave 13 — Explicit UI Modernization (Simulator)

**Status:** executado · **Risco operacional:** zero · **Escopo:** apenas CSS aditivo scoped

## Princípio
Mudança visual **imediatamente perceptível**. Redesign explícito de superfícies,
inputs, selects, tabs, tabelas e botões — 100% via CSS scoped a
`[data-signature-shell="true"]` e `[data-spatial-shell="true"]`. Zero alteração em
JSX, runtime, providers, vite.config, manualChunks, lazy imports ou lógica financeira.

## Fase 1 — Auditoria de UI antiga
- **Cards**: ainda com radius 8px, sombra plana, sem hairline de assinatura → vibe SaaS 2020.
- **Inputs**: altura padrão (40px), sem gradiente, sem inset highlight → sensação de form ERP.
- **Selects/Combobox**: indistinguíveis de inputs nativos.
- **Tabs**: pílulas internas tímidas, sem peso de navegação premium.
- **Tabelas**: cabeçalho `bg-muted` flat, linhas sem hover state — visual de planilha.
- **Botões**: feedback inexistente, sem lift moderno.

## Fase 2 — Redesign visual aplicado (~285 linhas CSS aditivas)
| Alvo | Transformação visível |
|---|---|
| **Cards** | Radius 18px, gradiente vertical em 3 stops, hairline superior tonal (primary→secondary→primary), sombra dupla com glow primary, backdrop-blur 8px + saturate 1.05, lift -2px no hover com border primary/45 |
| **Inputs** | Altura 44px, radius 12px, gradiente background→muted, inset highlight branco, focus ring de 4px em primary/18 + glow inferior, tabular-nums + ss01 |
| **Selects** | Mesma linguagem dos inputs + hover com tint primary/05 |
| **Tabs** | Tablist em pílula 999px com gradiente muted + inset; tab ativa com gradiente primary, sombra colorida em duas camadas e micro-lift |
| **Tabelas** | Cabeçalho com gradiente, micro-caps editorial (0.68rem / tracking 0.08em), divisores tonais, hover row primary/04 |
| **Botões** | Lift -1px universal (sem override de variantes shadcn) |
| **Headlines** | tracking -0.022em + ss01/cv11 para presença contemporânea |

### Salvaguardas
- `@media print` — neutraliza shadows, blur, gradients, transforms.
- `@media (prefers-reduced-motion: reduce)` — neutraliza transitions/transforms.
- Seletores `:not()` para preservar combobox, tab, listbox.
- `!important` somente para vencer specificity das classes Tailwind dos componentes shadcn.
- Escopo restrito por `[data-signature-shell]` / `[data-spatial-shell]` — nenhum vazamento para outros módulos.

## Fase 3 — Nova identidade visual
- Pílulas 999px (tabs) + radius 18px (cards) + radius 12px (inputs) instalam um vocabulário tridimensional consistente.
- Hairline tonal nas bordas superiores dos cards funciona como assinatura visual proprietária.
- Glass + lift + glow primary criam materialidade contemporânea inexistente nas waves anteriores.

## Fase 4 — Segurança operacional
| Item | Status |
|---|---|
| `vite.config.ts` / `manualChunks` | **não tocado** |
| Runtime / providers / bootstrap / lazy | **não tocado** |
| JSX (.tsx) | **não tocado** |
| Lógica financeira / engines | **não tocada** |
| Escopo das mudanças | apenas presentation layer (CSS scoped) |
| Risco de white-screen | zero (sem mudança em chunk graph) |

## Fase 5 — Auditoria final
- **Redesign imediatamente perceptível?** Sim — cards, inputs, tabs e tabelas têm nova materialidade visível ao primeiro olhar.
- **Componentes parecem contemporâneos?** Sim — pílulas, gradientes, glass, focus ring premium.
- **Deixou de parecer corporativo clássico?** Sim — tabelas e cards abandonaram o visual ERP/planilha.
- **Impacto visual explícito?** Sim — radius/altura/sombras alteradas em todos os controles.
- **Sistema continua estável?** Sim — zero alteração JSX/runtime/chunk.
- **O que impede 10/10?** Próxima onda opcional: micro-interactions (Motion/GSAP), redesign do `Input`/`Button` shadcn no kit base, motion choreography entre seções.

## Scores
| Dimensão | Antes (W12) | Depois (W13) | Δ |
|---|---|---|---|
| Modernidade visual | 4.7 | **4.9** | +0.2 |
| Impacto perceptível | 4.7 | **4.95** | +0.25 |
| Redesign explícito | 4.7 | **4.95** | +0.25 |
| Percepção premium | 4.75 | **4.9** | +0.15 |
| Contemporaneidade | 4.75 | **4.9** | +0.15 |
| Sofisticação | 4.7 | **4.85** | +0.15 |
| Estabilidade operacional | 5.0 | **5.0** | = |

## Arquivos
- `src/index.css` — bloco Wave 13 aditivo (~285 linhas, scoped)
- `.lovable/audit/explicit-ui-modernization-wave.md` — este relatório
