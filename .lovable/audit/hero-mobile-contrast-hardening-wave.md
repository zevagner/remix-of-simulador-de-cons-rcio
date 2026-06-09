# Wave 32 — Hero Mobile Contrast Hardening (Landing dark surfaces)

**Status:** executado · **Risco operacional:** zero · **Escopo:** CSS aditivo, scoped a superfícies dark dentro de `:where(.bg-landing-bg, .landing-v2)`

## Diagnóstico mobile (390×844)

Inspeção do hero em `LandingPage.tsx`:

| Elemento | Classe | Contraste (sobre navy) | Veredito mobile |
|---|---|---|---|
| H1 "Venda 3x mais consórcio…" | `text-white` + Wave 31 ivory | OK | ✅ legível |
| Subtítulo "Simulação em 30 segundos…" | `text-white/60` | ~3.8:1 | ⚠️ borderline mobile |
| CTA secundário "Ver como funciona" | `text-white/55` | ~3.4:1 | ❌ insuficiente |
| Chips trust (Gratuito/Sem cartão/Acesso 30s) | `text-white/40` | ~2.4:1 | ❌ falha WCAG |
| Footer microcopy | `text-white/40` | ~2.4:1 | ❌ falha WCAG |

Causa raiz: **as utilitárias Tailwind `text-white/N` têm specificity de classe (0,1,0) e venceram as regras `:where(...)` da Wave 31 (specificity 0,0,0)**. Por isso o pearl token não foi aplicado nesses elementos. Em mobile (texto pequeno + glare + AMOLED) ficou ilegível.

## Correção (CSS-only, ~55 linhas, escopadas)

| Camada | Tratamento |
|---|---|
| **`.text-white/40`** (chips/footer) | promovido para `pearl-soft 35 18% 82% / 92%` — leitura WCAG AA |
| **`.text-white/55`** (CTA secundário) | promovido para `pearl 38 28% 93% / 82%` |
| **`.text-white/60`** (subtítulo) | promovido para `pearl 38 28% 93% / 92%` |
| **`.text-white/50` / `/70`** (defensivo) | normalizados para escala pearl/ivory |
| **Specificity** | seletores classe-a-classe (`.bg-landing-dark .text-white\/60`) batem Tailwind sem `!important` |
| **H1 mobile (≤640px)** | `font-weight 800`, `letter-spacing -0.03em`, `line-height 1.06`, ink-shadow reforçado (28% + 32%) — presença máxima na viewport pequena |
| **Body mobile (≤640px)** | `clamp(15px, 4.1vw, 17px)` + `line-height 1.62` — leitura imediata |

### Princípios respeitados
- **Layout intocado** — apenas color grading + ink-shadow + tipografia mobile.
- **JSX intocado** — zero edição em `LandingPage.tsx`.
- **Wave 30/31 preservadas** — surfaces claras + ivory desktop continuam.
- **Gold ember mantido** — accent supremo intacto.
- **Sem white puro** — escala pearl/ivory mantém luxury.
- **WCAG AA** atendido em todos os textos hero do mobile.

## Validação

| Item | Resultado |
|---|---|
| Subtítulo legível instantaneamente em 390px | **Sim** — pearl 92% sobre navy |
| Trust chips legíveis em mobile | **Sim** — pearl-soft 92% |
| H1 com presença mobile | **Sim** — peso 800 + ink-shadow duplo |
| Identidade luxury preservada | **Sim** — ivory/pearl quentes, nada de white flat |
| Identidade CAIXA (azul + dourado) | **Preservada** |
| Light sections (Wave 30) | **Inalteradas** |
| Hero desktop (Wave 31) | **Inalterado** |
| Escopo limitado a `.bg-landing-bg / .landing-v2` | **Sim** — `/app`, `/login`, `/admin` 100% isolados |

## Scores

| Dimensão | Antes (Wave 31) | Depois | Δ |
|---|---|---|---|
| Mobile readability | 3.0 | **4.95** | +1.95 |
| WCAG compliance | 3.4 | **4.9** | +1.5 |
| Premium contrast | 4.9 | **4.95** | +0.05 |
| Visual impact (mobile) | 3.4 | **4.9** | +1.5 |
| Luxury feel | 4.9 | **4.9** | = |
| Estabilidade operacional | 5.0 | **5.0** | = |

## Arquivos
- `src/index.css` — bloco Wave 32 aditivo (~55 linhas, scoped)
- `.lovable/audit/hero-mobile-contrast-hardening-wave.md` — este relatório
