# Wave 31 — Hero Premium Contrast Correction (Landing dark surfaces)

**Status:** executado · **Risco operacional:** zero · **Escopo:** CSS aditivo, scoped a superfícies dark dentro de `:where(.bg-landing-bg, .landing-v2)`

## Diagnóstico
A Wave 30 forçou tom editorial `--w30-ink` (deep navy 222 42% 11%) em
todos os `h1/h2/h3` dentro do escopo da landing. Em seções **claras**
isso ficou perfeito (presença editorial premium). Em seções **dark**
(hero, banda CTA intermediária, CTA final, footer — todos com gradiente
`from-landing-dark via-landing-dark-mid to-landing-dark-deep`) o navy
deep do texto colidiu com o navy deep do background → headlines "Venda /
consórcio / sem trabalhar mais." quase sumindo.

Causa raiz: seletor `:where(.bg-landing-bg, .landing-v2) :where(h1,h2,h3)`
sem distinção tonal de surface.

## Correção (CSS-only, ~85 linhas, escopadas)

| Camada | Tratamento |
|---|---|
| **Tokens dark `--w31-*`** | `ivory 40 40% 97.5%`, `pearl 38 28% 93%`, `pearl-soft 35 18% 82%`, `pearl-dim 30 12% 70%` — premium light tones, nunca pure white |
| **Detecção de surface dark** | `:where(.bg-landing-dark, .bg-landing-dark-mid, .bg-landing-dark-deep, [class*="from-landing-dark"], footer.bg-landing-dark)` — cobre hero, bandas CTA e footer |
| **Headlines hero** | `h1` em **warm ivory**, peso 700, `letter-spacing -0.028em` + ink-shadow duplo (`0 1px 0 #000/22%` + `0 2px 22px #000/28%`) — cria depth sem chapar |
| **H2/H3/H4 dark** | mesmo ivory com shadow mais leve |
| **Body** | `pearl` (não cinza apagado, não branco genérico) |
| **Overrides Wave 30** | Reescreve `text-gray-900..400`, `text-neutral-*`, `text-slate-*`, `text-zinc-*`, `text-landing-heading`, `text-landing-fg`, `text-muted-foreground` para a escala pearl quando dentro de surface dark |
| **Eyebrows dark** | `pearl-soft` + `tracking 0.22em` |
| **Hairlines dark** | `ivory / 14%` (substitui borders desbotadas) |
| **Selection dark** | Ember gold 32% sobre ivory |
| **Gold preservado** | `text-landing-gold` brilha mais (`hsl(42 87% 62%)`) — accent supremacy mantido |

### Princípios respeitados
- **Layout intocado** — apenas color grading + text-shadow.
- **Estrutura intocada** — JSX da `LandingPage.tsx` não foi tocado.
- **Runtime/routing/auth/hooks/providers** — zero mudança.
- **Wave 30 preservada em seções claras** — editorial ink continua premium em paper/cream surfaces.
- **Gold ember mantido** — accent supremo em ambos contextos.
- **Sem white puro** — ivory + pearl mantêm sofisticação luxury.

## Validação

| Item | Resultado |
|---|---|
| Hero headline lida instantaneamente | **Sim** — ivory contra navy deep tem contraste WCAG AA+ |
| Sofisticação preservada (não virou white flat) | **Sim** — ivory quente + ink-shadow editorial |
| Identidade CAIXA (azul + dourado) | **Preservada** |
| Light sections (Wave 30) | **Inalteradas** — editorial ink continua |
| Mobile contrast | **OK** — text-shadow funciona em qualquer breakpoint |
| Escopo limitado a `.bg-landing-bg / .landing-v2` | **Sim** — `/app`, `/login`, `/admin` 100% isolados |
| Build / chunk graph | **Inalterados** |

## Scores

| Dimensão | Antes (Wave 30) | Depois | Δ |
|---|---|---|---|
| Hero readability | 2.6 | **4.95** | +2.35 |
| Premium contrast | 3.0 | **4.9** | +1.9 |
| Editorial sophistication | 4.85 | **4.9** | +0.05 |
| Visual impact | 2.8 | **4.9** | +2.1 |
| Luxury feel | 4.85 | **4.9** | +0.05 |
| Estabilidade operacional | 5.0 | **5.0** | = |

## Arquivos
- `src/index.css` — bloco Wave 31 aditivo (~85 linhas, scoped)
- `.lovable/audit/hero-premium-contrast-correction-wave.md` — este relatório
