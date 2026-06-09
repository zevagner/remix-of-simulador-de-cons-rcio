# Premium Executive UX Refinement Pass

> Refinamento perceptivo do módulo **Estratégias Patrimoniais** após a Wave
> Editorial. Objetivo: elevar a sensação de **sofisticação silenciosa** sem
> tocar engine, cálculo, `StrategyDetailDialog` ou arquitetura. Toda a
> mudança vive em uma única função render dentro de
> `src/components/modules/wealth/StrategyLibrarySection.tsx`.

---

## Executive Visual Hierarchy

Ajustes de respiração e tipografia sem mudar a estrutura.

| Token                      | Antes                       | Depois                          |
| -------------------------- | --------------------------- | ------------------------------- |
| Espaço entre seções        | `space-y-10 md:space-y-14`  | `space-y-14 md:space-y-20`      |
| Espaço dentro do hero      | `space-y-5`                 | `space-y-6 md:space-y-7`        |
| Espaço dentro do capítulo  | `space-y-6`                 | `space-y-7 md:space-y-8`        |
| Eyebrow tracking           | `tracking-[0.2em]`          | `tracking-[0.22em]`             |
| Título hero                | `26/32px` semibold          | `28/36px` semibold + tracking `-0.01em` |
| Título capítulo            | `22/26px`                   | `23/28px` + leading `1.1`       |
| Corpo de texto             | `14/15px` · leading-relaxed | `14.5/16px` · leading `1.65` · `max-w-2xl` |
| Eyebrow do hero            | apenas ícone + texto        | adiciona **hairline** lateral `≤80px` (sm+) |

A largura controlada (`max-w-2xl`) força linhas de leitura ergonômicas
(~70 caracteres) — padrão de relatório executivo, não de marketing.

---

## Chapter Transition Refinement

Substituí o separador anterior (`pt-2 border-t border-border/40`) por uma
**régua editorial** com dois elementos discretos:

```tsx
{idx > 0 && (
  <div className="flex items-center gap-4 pt-2" aria-hidden>
    <span className="font-serif text-[13px] italic text-muted-foreground/50">
      {chapter.eyebrow.replace(/^Cap[íi]tulo\s+/i, '')}   {/* I, II, III… */}
    </span>
    <span className="h-px flex-1 bg-gradient-to-r from-border/70 via-border/40 to-transparent" />
  </div>
)}
```

Efeito: a transição entre capítulos parece **virada de página**, não corte
abrupto de grade. O numeral romano em serifa italic + a fade-hairline
transmitem ritmo narrativo contínuo.

`aria-hidden` no separador evita poluir leitores de tela — o `<h3>` do
capítulo permanece como landmark semântico real.

---

## Premium Card Rhythm

Hover refinado em `StrategyLibraryCard`:

| Aspecto       | Antes                                | Depois                                                              |
| ------------- | ------------------------------------ | ------------------------------------------------------------------- |
| Sombra base   | `0_1px_2px_rgba(0,0,0,0.04)`         | `0_1px_2px_rgba(15,23,42,0.03)` (cool slate, mais editorial)        |
| Sombra hover  | `hover:shadow-md`                    | `hover:shadow-[0_10px_28px_-18px_rgba(15,23,42,0.18)]` (lifted)     |
| Transform     | —                                    | `hover:-translate-y-[2px]` com `transition-[transform,box-shadow,border-color]` `duration-300 ease-out` |
| Borda hover   | `hover:border-border`                | `hover:border-foreground/15` (mais sutil, premium)                  |
| Motion safety | —                                    | `motion-reduce:transform-none motion-reduce:transition-none`        |
| `will-change` | —                                    | `will-change-transform` (GPU layer)                                 |

Cada interação é **silenciosa e rápida** (300ms ease-out, ≤2px de lift,
sombra fria) — sem glow, sem gradiente colorido, sem scale, sem rotação.
Respeita `prefers-reduced-motion` no nível do Tailwind.

KPIs, CTA, conteúdo e altura uniforme do card permanecem inalterados.

---

## Microinteraction Refinement

Microinterações novas:

- **Chip de navegação**: `group/chip` permite que o dot interno mude de
  `bg-primary/60` → `bg-primary` no hover; transição apenas em
  `color, border-color, background-color, box-shadow` (não em transform).
  `focus-visible:ring-2 ring-ring ring-offset-2` para teclado premium.
- **Smooth scroll** já tratado em `smoothScrollTo` (preserva
  `history.replaceState` sem novo jump, respeita motion do user agent).
- **Card lift** descrito acima (≤2px, 300ms ease-out).

Tudo abaixo do limiar perceptivo de "animação" — entra na categoria
**resposta tátil silenciosa**.

---

## Mobile Executive UX

- Hero `space-y-6` mobile / `space-y-7` desktop — respiro generoso sem
  ocupar fold inteiro.
- Título do hero cresce de 28px (mobile) para 36px (desktop) com
  `tracking-[-0.01em]` — leitura confortável a 320–390px.
- Chips em `flex-wrap gap-2` com `py-1.5 px-3.5` mantêm alvos
  toque ≥32px de altura efetiva (com padding interno + dot).
- Separador de capítulo é hairline + numeral, **não** ocupa altura mensurável
  no mobile (`pt-2` apenas) — reduz scroll fatigue.
- Hairline lateral do eyebrow hero (`hidden sm:inline-block`) some no mobile,
  liberando largura.
- `scroll-mt-24` em cada section garante que o header não cubra o título do
  capítulo após o smooth-scroll, em qualquer viewport.

Card já tinha `min-h-11` no CTA mobile (touch ≥44px) — preservado.

---

## Executive Scanning Validation

Leitura típica de 3 segundos por executivo:

1. **Hero** — eyebrow ("Mesa consultiva patrimonial") + título grande +
   um parágrafo + chips com contagem por intenção.
2. **Recomendadas** (se houver contexto) — bloco curto, ≤3 cards.
3. **Capítulos** — eyebrow (Capítulo II) + título grande + uma frase + grid
   2–9 cards.
4. **Card** — chapter dot, título 15.5–16px, tagline 3 linhas, KPI hero,
   secundários, CTA único.

Padrão de varredura: **F-pattern editorial** (texto principal à esquerda,
títulos como âncoras verticais). Sem competição visual entre seções,
sem múltiplos CTAs, sem badges promocionais.

---

## Premium Atmosphere Validation

Princípios anti-"dashboard genérica" verificados:

| Anti-padrão                              | Status no módulo               |
| ---------------------------------------- | ------------------------------ |
| Glow excessivo / box-shadow saturado     | Removido — sombras cool slate  |
| Gradiente colorido em cards/headers      | Apenas hairline fade discreto  |
| Motion lúdica (scale, rotate, bounce)    | Banido — só translate-y ≤2px   |
| Badges promocionais / "novo!"            | Inexistentes                   |
| Múltiplos CTAs por card                  | 1 único — "Ver estratégia completa" |
| Tipografia futurista                     | Inter/sans semibold editorial  |
| Mini-dashboard em card                   | 1 hero KPI + ≤2 secundários (governado) |
| Excesso de border / "outline soup"       | `border-border/60` discreto    |
| Cores saturadas marketing-style          | Tokens semânticos do design system |

Resultado atmosférico: **relatório executivo premium**, não dashboard de
marketing. Próximo de Brunello Cucinelli / The Economist em densidade
visual — não de SaaS bootcamp.

---

## Zero Regression Validation

| Área protegida                                          | Status     |
| ------------------------------------------------------- | ---------- |
| `src/core/finance/*` (motor financeiro)                 | Intacto    |
| `strategyLibraryData.ts` (fonte canônica)               | Intacto    |
| `strategyContextScoring.ts` (scoring engine)            | Intacto    |
| `strategyDecisionSupport.ts`                            | Intacto    |
| `strategyExecutiveKpis.ts` (KPI governance)             | Intacto    |
| `strategyExplanationEnhancements.ts`                    | Intacto    |
| `StrategyDetailDialog` (Nível 2 de profundidade)        | Intacto    |
| `ViabilityPreview` (hero KPI + secundários + governance)| Intacto    |
| `WealthPlatformModule` hero externo                     | Intacto    |
| Constituição V2 — locks, F2/H2/F3/F4, COMPARE_MAX       | Preservado |
| Performance (transform GPU-friendly, will-change)       | Preservado |
| Acessibilidade — focus-visible, aria-hidden semântico   | Reforçada  |
| `prefers-reduced-motion`                                | Reforçada  |

Nenhum cálculo, KPI, disclaimer, regra de negócio ou contexto IA tocado.
Bundle: zero novo import, zero nova dependência.

---

## Final Premium UX State

| Dimensão                       | Antes (Editorial Wave)              | Depois (Premium Refinement)                         |
| ------------------------------ | ----------------------------------- | --------------------------------------------------- |
| Sensação geral                 | Consultoria organizada              | Consultoria premium silenciosa                      |
| Ritmo entre capítulos          | `border-t` linear                   | Numeral serifa + hairline gradiente                 |
| Hierarquia tipográfica         | Funcional                           | Editorial (tracking, max-w-2xl, leading 1.65)       |
| Cards — feedback de hover      | Sombra md genérica                  | Lift -2px + sombra cool slate (300ms ease-out)      |
| Chips de navegação             | Hover de cor simples                | Group hover com dot animado + focus-ring premium    |
| Atmosfera                      | Editorial limpa                     | Editorial **calma** (cool slate, hairline fade)     |
| Mobile                         | OK                                  | OK + respiro maior + hairline ocultas no estreito   |
| Motion safety                  | Implícita                           | `motion-reduce:` explícito em transitions e transforms |

---

## Final Verdict

O módulo **transmite agora sofisticação consultiva premium** — não mais
"biblioteca de cards refinada":

- A transição entre capítulos parece **virar uma página**, não cruzar uma
  régua de seção.
- O hover dos cards é uma **resposta tátil silenciosa**, não uma animação.
- A tipografia respeita **ergonomia executiva** (largura controlada,
  tracking apertado, leading 1.65) — sensação de relatório editorial.
- A atmosfera é **fria, premium e silenciosa** — sem glow, sem gradiente
  colorido, sem motion lúdica.
- Mobile mantém a mesma densidade premium com respiro proporcional e
  alvos toque adequados.

**Resultado**: uma **mesa patrimonial executiva interativa premium** —
próxima de um relatório consultivo de wealth management — e não uma grade
sofisticada de cards financeiros.
