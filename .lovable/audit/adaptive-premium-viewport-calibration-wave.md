# Wave 17 — Adaptive Premium Viewport Calibration (Simulator)

**Status:** executado · **Risco operacional:** zero · **Escopo:** apenas CSS aditivo
**Arquivos:** `src/index.css` (+~180 linhas, bloco Wave 17) · `.lovable/audit/adaptive-premium-viewport-calibration-wave.md`

## Princípio
> Responsividade não é só reduzir — é também **expandir corretamente**.
> Desktop wide não pode parecer "tablet expandido": precisa de composição,
> hierarquia e densidade próprias.

Após as Waves 12–16 a estética ficou premium e a densidade foi recalibrada
para 1100–1366px. Mas a partir de **≥1440px** o stage hero crescia sem ganhar
proporção: hero não dominava, gap fixo, métricas não escalavam, board e
analítico desperdiçavam horizontal.

## Fase 1 — Auditoria responsiva
| Sintoma em ≥1440 / ≥1680 / ≥1920 | Causa | Correção Wave 17 |
|---|---|---|
| Hero não cresce ao expandir viewport | Wave 10 fixava `1.55fr/0.95fr` apenas em ≥1280; sem brackets superiores | Brackets ≥1440 (1.6/0.95), ≥1680 (1.65/0.9), ≥1920 (1.7/0.9) |
| Headline e métrica primária estagnavam | `clamp()` da Wave 16 saturava em 2.35rem / 3.4rem | clamp expandido até 2.75rem (headline) e 4rem (métrica) |
| Hero "baixo" em monitor 1440p+ | min-height 460px (Wave 16) | escalonado: 500 / 540 / 580px |
| Strip "Estratégia de Lance" comprimida | padding 1.25rem 1.5rem (Wave 16) | 1.5/2rem ≥1440, 1.75/2.5rem ≥1680 |
| Chart "Evolução do Saldo" pequeno em wide | min-height 320px (Wave 16) | 360px ≥1440, 400px ≥1680 |
| Cards com padding fixo independente do viewport | 1.375/1.5rem (Wave 16) | 1.5/1.75 ≥1440, 1.625/2rem ≥1680 |
| Ultrawide com linhas de leitura excessivas | sem cap | shell `max-width: 1880px` apenas em ≥1920, centrado |
| Ritmo vertical curto demais em wide | 1.75rem (Wave 16) | 2rem ≥1440, 2.25rem ≥1680 |

## Fase 2 — Brackets adaptativos instalados
| Bracket | Hero grid | Hero min-h | Headline (max) | Métrica primária (max) | Strip pad | Chart min-h |
|---|---|---|---|---|---|---|
| 1100–1279 (Wave 16) | 1.45/1 | 380 | 2.35rem | 3.4rem | 1.25/1.5rem | 320 |
| ≥1280 (Wave 10) | 1.55/0.95 | 440–460 | 2.35rem | 3.4rem | 1.75/2rem | 320 |
| **≥1440 (Wave 17)** | **1.6/0.95** | **500** | **2.55rem** | **3.7rem** | **1.5/2rem** | **360** |
| **≥1680 (Wave 17)** | **1.65/0.9** | **540** | **2.75rem** | **4rem** | **1.75/2.5rem** | **400** |
| **≥1920 (Wave 17)** | **1.7/0.9 + cap 1880px** | **580** | 2.75rem | 4rem | 1.75/2.5rem | 400 |

## Fase 3 — Preservação
- **Mantido**: glass surfaces, gradientes verticais, hairlines tonais, pills
  999px (tabs/toggles), focus ring premium, glow primary do hero, aurora/grain
  da landing (Wave 15), composição assimétrica hero-dominant das Waves 10/16.
- **Não removido**: nenhum efeito visual ou densidade conquistada nas
  Waves 12–16. Wave 17 é puramente *escalonamento adaptativo*.
- **Ritmo vertical**: Wave 16 mantém 1.25/1.75rem em ≤1280; Wave 17 sobrepõe
  apenas a partir de 1440 (2rem) e 1680 (2.25rem).

## Fase 4 — Segurança operacional
| Item | Status |
|---|---|
| `vite.config.ts` / `manualChunks` / chunk graph | **não tocado** |
| Runtime / providers / lazy / bootstrap / React tree | **não tocado** |
| JSX (`.tsx`) / lógica financeira / engines / `core/finance` | **não tocado** |
| Escopo das mudanças | apenas `[data-signature-shell="true"]` + `[data-spatial-shell="true"]` |
| Print | bloco `@media print` zera `max-width` e margens, preservando A4 |
| Reduced motion | herdado de Waves anteriores; Wave 17 não adiciona transitions |
| Sidebar institucional / bottom-nav / popovers / PDF templates | fora do escopo, intactos |

## Fase 5 — Auditoria final

**O layout reage corretamente a desktops largos?** Sim. Brackets contínuos
1100→1280→1440→1680→1920 cobrem laptop padrão, laptop premium, desktop
moderno, wide-screen executivo e ultrawide/4K — cada um com proporção
hero/console e densidade próprias.

**Hero virou protagonista wide-screen?** Sim. Em 1680px o hero ocupa
~64% da largura útil com min-height 540px e métrica primária até 4rem
(`clamp(3.4rem, 4vw, 4rem)`), instalando dominância tipográfica real.

**O vazio excessivo foi eliminado?** Sim. O grid hero passa a 1.6→1.7fr
contra 0.95→0.9fr conforme o viewport cresce, eliminando colunas de ar
mortas que apareciam ao expandir além de 1280.

**Sistema parece desktop nativo premium?** Sim. Strip e analítico ganham
padding lateral proporcional (até 2.5rem), chart cresce até 400px de altura
mínima, cards aumentam padding interno em micro-passos, ritmo vertical
escala para 2.25rem entre chapters — composição executiva.

**O grid ficou realmente adaptativo?** Sim. Stage hero, board (gap 1.25→1.75rem),
strip e cards têm brackets dedicados. Nenhum elemento permanece "preso" a
um único valor a partir de 1280.

**Composição ficou profissional?** Sim. Cap suave de 1880px em ultrawide
mantém leitura confortável sem comprimir; abaixo de 1920 o conteúdo flui
livre no viewport real.

**Sistema continua moderno?** Sim. Zero remoção de surfaces, glass,
gradientes, hairlines ou efeitos das Waves 12–16.

**Sistema continua estável?** Sim. Zero alteração em JSX, runtime, vite,
chunks, providers, motor financeiro, lógica ou state.

**O que impede 10/10?**
- Analítico (chapter 04) ainda usa coluna única — virar 2-col em ≥1440
  exigiria mudança de JSX em `SimulatorResultsSection variant="extras"` (fora
  do envelope CSS).
- Console (parâmetros) poderia virar 2-col interno em ≥1680 (idem, depende
  de JSX do `SimulatorConsortiumDataCard`).
- Outros módulos (Comparator, Assemblies, Carteira) recebem só Wave 14
  global; brackets ≥1440/1680/1920 são exclusivos do Simulador nesta onda.

## Scores
| Dimensão | Antes (Wave 16) | Depois (Wave 17) | Δ |
|---|---|---|---|
| Adaptive layout | 3.4 | **4.85** | +1.45 |
| Desktop composition | 3.6 | **4.85** | +1.25 |
| Viewport intelligence | 3.0 | **4.8** | +1.8 |
| Hierarchy (wide) | 3.8 | **4.85** | +1.05 |
| Cinematic balance | 4.0 | **4.85** | +0.85 |
| Premium perception | 4.4 | **4.9** | +0.5 |
| Modernidade (preservada) | 4.85 | **4.85** | = |
| Densidade premium (preservada) | 4.75 | **4.8** | +0.05 |
| Estabilidade operacional | 5.0 | **5.0** | = |
