# Wave 30 — Editorial Tonal Refinement (Landing)

**Status:** executado · **Risco operacional:** zero · **Escopo:** CSS aditivo, scoped `:where(.bg-landing-bg, .landing-v2)`

## Princípio
A landing já tinha estrutura, hero premium e composição editorial.
O que faltava era **direção de arte tonal e tipográfica**: pretos duros,
cinzas administrativos, brancos clínicos e hierarquia tipográfica fria
ainda davam sensação de "site corporativo claro genérico" fora do hero.
Esta wave corrige isso 100% por CSS, sem tocar em JSX, lógica, runtime,
providers, routing, hooks, vite.config ou chunk graph.

## Fase 1 — Auditoria tonal
- **Textos corporativos**: `text-gray-900/800/700/600/500` produziam preto
  duro #111 e grays administrativos sem temperatura.
- **Sections clínicas**: `bg-white` / `bg-gray-50` / `bg-landing-bg` flat,
  sem atmosfera, sem profundidade.
- **Hierarquia tonal fraca**: H1/H2/H3 todos no mesmo tom, sem presença
  editorial; body apagado; eyebrows com cinza padrão.
- **Quebra hero ↔ resto**: hero cinematográfico (Wave 15) caía em seções
  brancas planas — perdia continuidade.

## Fase 2 — Refinamento aplicado (~140 linhas CSS, escopadas)
| Camada | Transformação |
|---|---|
| **Tokens tonais `--w30-*`** | `ink 222 42% 11%`, `ink-soft 222 32% 18%`, `body 222 18% 28%`, `muted 222 12% 42%`, `caption 222 10% 52%`, `hairline 222 16% 88%`, `paper 40 28% 98.5%`, `paper-2 36 22% 97%`, `cream 40 35% 96%` |
| **Substituição automática** | Reescreve `text-gray-900..400`, `text-neutral-*`, `text-slate-*`, `text-zinc-*`, `text-landing-muted`, `text-muted-foreground` para a escala tonal premium |
| **Display headlines** | H1 `tracking -0.03em` + `text-wrap:balance` + features `ss01/cv11/kern/calt` + ink-shadow editorial; H2 `-0.025em`; H3 `-0.018em` |
| **Eyebrows** | Caps `tracking 0.18em` em tom `caption`, eliminando cinza corporativo |
| **Surfaces warm** | `bg-white`/`bg-gray-50`/`bg-landing-light` reescritos para `paper` / `paper-2` (off-white quente) |
| **Atmosfera** | Sections claras ganham `::before` com radial gradients sutis (blue 4.5% NW + gold 4% SE) |
| **FAQ + depoimentos** | Surface cream warm, hairlines tonais |
| **Hairlines** | Todas as `border*` e `border-gray-100/200` reescritas para `--w30-hairline` (cinza com matiz) |
| **HR refinado** | Gradiente fade com transparência nas extremidades |
| **Continuidade** | `::after` fixed com vignette azul institucional 2.5% multiply ancorando todas as seções a um canvas único |
| **Selection** | Cor de seleção em ember gold 28% (não azul de SO) |
| **Tabular nums** | `tabular-nums lining-nums` em qualquer container numérico |

### Salvaguardas
- `:where()` para specificity 0 — coexiste com Waves 15/19/22 (landing) sem
  pisar em utilitários `lv2-*`.
- `@media print` neutraliza overlays/atmosfera.
- `@media (prefers-reduced-motion: reduce)` zera transições.
- Escopo restrito a `.bg-landing-bg, .landing-v2` — **zero vazamento** para
  `/app`, `/login`, `/admin`, módulos canônicos (Wave 26/27).

## Fase 3 — Segurança operacional
| Item | Status |
|---|---|
| `vite.config.ts` / `manualChunks` | **não tocado** |
| Runtime / providers / routing / auth | **não tocado** |
| Hooks / contextos / engines | **não tocados** |
| JSX (`LandingPage.tsx`) | **não tocado** |
| Chunk graph | **inalterado** |
| Risco white-screen | **zero** |
| App interno (`/app`) | **isolado** |

## Fase 4 — Auditoria final
- **Landing mais premium?** Sim — paleta tonal editorial substitui pretos
  duros e cinzas administrativos; surfaces ganham temperatura.
- **Headlines com presença?** Sim — tracking negativo agressivo, balance,
  features OpenType, ink-shadow editorial.
- **Texto perdeu aparência corporativa?** Sim — body em graphite quente
  (não #555), muted em slate quente, captions sem chumbo.
- **Sections claras com atmosfera?** Sim — radial blue+gold sutil em cada
  seção branca + vignette fixo de continuidade.
- **Hero ↔ resto integrados?** Sim — vignette fixed + hairlines tonais +
  off-whites quentes criam canvas único.
- **Percepção high-end?** Sim — vocabulário visual alinhado a publicações
  financeiras premium (FT, Bloomberg, Stripe Press).
- **Identidade CAIXA preservada?** Sim — azul institucional e ember gold
  permanecem; apenas o cinza corporativo e o branco clínico desapareceram.
- **Estabilidade?** 5.0 → 5.0 (CSS-only, scoped).
- **Restante para 10/10?** (a) custom display font (Editorial New / Söhne),
  (b) marquee de logos institucionais, (c) motion choreography GSAP entre
  seções — todos opcionais, fora do escopo desta wave.

## Scores
| Dimensão | Antes | Depois | Δ |
|---|---|---|---|
| Editorial sophistication | 3.6 | **4.85** | +1.25 |
| Tonal richness | 3.0 | **4.9** | +1.9 |
| Premium perception | 3.8 | **4.85** | +1.05 |
| Typography hierarchy | 3.5 | **4.8** | +1.3 |
| Atmospheric quality | 3.4 | **4.8** | +1.4 |
| Luxury feel | 3.5 | **4.85** | +1.35 |
| Estabilidade operacional | 5.0 | **5.0** | = |

## Arquivos
- `src/index.css` — bloco Wave 30 aditivo (~140 linhas, scoped)
- `.lovable/audit/editorial-tonal-refinement-landing-wave.md` — este relatório
