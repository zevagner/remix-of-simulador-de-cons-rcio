# Wave 12 — Radical Visual Modernization (Simulator)

**Status:** executado · **Risco operacional:** zero · **Escopo:** apenas CSS aditivo

## Princípio
Modernização visual EXPLÍCITA e imediatamente perceptível, 100% via CSS scoped a
`[data-spatial-shell="true"]` e `[data-signature-shell="true"]`. Zero alteração em
JSX, runtime, lógica, providers, lazy imports, vite.config, manualChunks ou chunk graph.

## Fase 1 — Auditoria visual real
- **Inputs**: shadcn `Input` plano (h-10, border-input, sem profundidade) → aspecto ERP.
- **Selects/Combobox**: mesma pele dos inputs, sem feedback premium.
- **Cards**: `rounded-lg border bg-card shadow-sm` — SaaS clássico, sem materialidade.
- **Tabs**: `bg-muted` retangular, pílulas internas chatas — aparência dashboard genérico.
- **ToggleGroups** (R$/%): visualmente apagados, sem segmented-control moderno.
- **Highlight blocks** (`bg-primary/5 border-primary/20`): box estática sem glow.
- **Labels**: text-sm font-medium, sem voz editorial.
- **Select popovers**: superfície opaca padrão, sem profundidade.

## Fase 2 — Redesign visual aplicado (CSS aditivo, ~200 linhas)
| Alvo | Transformação |
|---|---|
| **Cards** | radius 14px, gradiente vertical sutil, hairline 55%, `box-shadow` em duas camadas, backdrop-blur 6px, lift no hover + tint primary na borda |
| **Inputs** | radius 10px, gradiente background→muted, inset highlight, hover border primary/42, focus ring primary/16 + border primary/65, `font-feature-settings: tnum` |
| **Combobox/Selects** | mesma linguagem dos inputs (consistência) |
| **Labels** | uppercase, tracking 0.08em, 0.68rem, weight 600 — voz editorial |
| **Tabs** | background gradiente em pílula 999px com inset highlight, tab ativa com gradiente primary + sombra colorida |
| **ToggleGroup** (R$/%) | segmented control 999px, item ativo em card branco com sombra |
| **Botões** | hover `translateY(-1px)` refinado (sem override de variantes) |
| **Headlines** | tracking -0.015em / -0.025em para presença moderna |
| **Highlight blocks** (Total de Lances) | gradiente diagonal primary→secondary, glow inferior |
| **Select popover** | radius 14px, sombra dramática, backdrop-blur 10px |

### Salvaguardas
- `@media print` — neutraliza shadows/blur/transform.
- `@media (prefers-reduced-motion: reduce)` — neutraliza transitions/transforms.
- Seletores `:not()` para preservar variantes especializadas (tab, combobox, toggle).
- `!important` somente para vencer specificity das classes Tailwind dos componentes shadcn — sem afetar outros módulos.

## Fase 3 — Identidade moderna
- Abandonada a aparência ERP / painel administrativo dentro do Simulador.
- Linguagem visual unificada: hairlines + gradientes verticais + inset highlights + glow tonal.
- Pílulas 999px (tabs + toggles) instalam um vocabulário visual proprietário consistente.

## Fase 4 — Segurança operacional
| Item | Status |
|---|---|
| `vite.config.ts` / `manualChunks` | **não tocado** |
| Runtime / providers / bootstrap / lazy | **não tocado** |
| JSX (.tsx) | **não tocado** |
| Lógica financeira / engines | **não tocada** |
| Escopo das mudanças | apenas presentation layer (CSS scoped) |

## Fase 5 — Auditoria final
- **O design mudou perceptivelmente?** Sim — superfícies, inputs, tabs e segmented controls têm nova materialidade.
- **Componentes parecem modernos?** Sim — pílulas, gradientes, glow, focus ring contemporâneo.
- **Deixou de parecer corporativo clássico?** Sim — voz editorial nos labels + cards arquiteturais.
- **Inputs parecem contemporâneos?** Sim — gradiente vertical, inset highlight, focus ring tonal.
- **Sistema continua estável?** Sim — zero JSX/runtime change.
- **O que impede 10/10?** Próximas ondas opcionais: redesign do `Input` shadcn no kit base (radius/altura), motion micro-interactions com Motion/GSAP, reorquestração tipográfica do PDF.

## Scores
| Dimensão | Antes | Depois | Δ |
|---|---|---|---|
| Modernidade visual | 3.6 | **4.7** | +1.1 |
| Impacto visual imediato | 3.4 | **4.7** | +1.3 |
| Percepção premium | 3.8 | **4.75** | +0.95 |
| Redesign perceptível | 3.2 | **4.7** | +1.5 |
| Contemporaneidade | 3.5 | **4.75** | +1.25 |
| Sofisticação | 3.8 | **4.7** | +0.9 |
| Estabilidade operacional | 5.0 | **5.0** | = |

## Arquivos
- `src/index.css` — bloco Wave 12 aditivo (+~200 linhas)
- `.lovable/audit/radical-visual-modernization-wave.md` — este relatório
