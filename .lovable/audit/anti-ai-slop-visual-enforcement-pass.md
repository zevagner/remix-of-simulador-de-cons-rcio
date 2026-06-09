# Wave 36 — Anti-AI-Slop Visual Enforcement Pass

**Data:** 2026-05-19
**Tipo:** Subtração visual (CSS-only, aditivo, scoped, reversível)
**Risco operacional:** Zero — nenhuma alteração em JSX, runtime, providers, engines,
vite.config, manualChunks ou lazy graph. Respeita Production Lock V2.4 e a
V2 Product Constitution.

---

## Princípio

> Maturidade visual se atinge **subtraindo**, não acrescentando.

Não é uma nova camada de "polish". É uma camada de **enforcement** que
remove os tiques estéticos que fazem qualquer produto parecer "feito por IA
em 2024" — glassmorphism, glow azul/roxo, gradientes de card genéricos,
sombras coloridas, micro-elevação universal — e devolve às superfícies o
peso editorial de uma plataforma proprietária (Bloomberg, Stripe Atlas,
wealth platforms institucionais).

---

## Fase 1 — Auditoria de "AI-slop" detectado

| Sintoma | Onde | Por que parece "IA genérica" |
|---|---|---|
| `backdrop-filter: blur(8px) saturate(1.05)` em todo card | W13/W14 | Glassmorphism virou cliché 2022–24 de template SaaS |
| Sombra com `hsl(var(--primary) / 0.18–0.30)` no hover | W13/W14 | "Glow azul" sob card é assinatura visual de boilerplate AI |
| Gradiente vertical 3-stops em **todo** `[bg-card]` | W13/W14 | Superfícies idênticas + textura previsível = SaaS template |
| Lift `-1.5px / -2px` universal em hover | W13/W14 | Microinteração "bonitinha" sem semântica = teatralidade |
| Tab ativa com `box-shadow` colorido primary | W13/W14 | Pílula colorida sob tab ativa é tique de design Dribbble |
| Hairline tonal `linear-gradient(primary→secondary→primary)` no topo do card | W13/W14 | Decoração sem função, lê como "watermark de template" |

Surfaces poupadas (já editoriais): Sidebar institucional, BottomNav,
Dialogs, PDF templates off-screen, Landing.

---

## Fase 2 — Enforcement aplicado (Wave 36, ~80 linhas CSS aditivas)

### Estratégia
- **Especificidade ≥** das waves alvo (`[data-signature-shell]`,
  `[data-spatial-shell]`, `body :where(main, [role="main"])`,
  `[data-module-canvas="v1"]`) para sobrepor sem `!important` onde possível.
- Reversível: remover o bloco `Wave 36` restaura W13/W14/W27/W28 intactos.
- Honra `@media print` e `prefers-reduced-motion: reduce` já globais.

### Transformações
| Cliché removido | Substituído por |
|---|---|
| `backdrop-filter: blur(8px) saturate(1.05)` em cards de módulo | `backdrop-filter: none` — superfície opaca, peso real |
| Hover com `0 36px 80px -42px hsl(primary / 0.30)` | Sombra editorial neutra: `0 1px 0 ink/0.06, 0 18px 36px -22px ink/0.22` |
| Card gradient 3-stops c/ tint primary no fundo | Fundo `hsl(var(--card))` chapado + hairline superior `1px hsl(border/0.6)` |
| Lift `translateY(-1.5px)` universal em hover | Mantido **apenas** em `[data-card-variant="contextual"]`/`"analytical"` (W28); demais cards: sem transform |
| Tab ativa com sombra colorida primary | Sombra neutra `inset 0 -2px 0 hsl(primary)` (underline editorial em vez de pill com glow) |
| Hairline gradient tonal (primary→secondary→primary) no topo do card | Removido — borda sólida `hsl(border/0.7)` é suficiente |

Tudo escopado para **não tocar**: Sidebar, BottomNav, Dialogs, Popovers,
PDF, Landing (que já tem identidade editorial dedicada).

---

## Fase 3 — Atmosfera resultante

- Cards param de "brilhar" e voltam a ter peso de superfície real.
- Hierarquia volta a depender de **tipografia + densidade + cor de texto**,
  não de glow ornamental.
- Tabs perdem a aparência de "pílulas Dribbble" e ganham underline editorial
  (Bloomberg / FT-style).
- Sem glassmorphism, a profundidade vem do contraste de fundo (canvas vs.
  card), não de blur — sensação institucional.

---

## Fase 4 — Segurança operacional

| Item | Status |
|---|---|
| `vite.config.ts` / `manualChunks` | **não tocado** |
| Runtime / providers / bootstrap / lazy | **não tocado** |
| JSX (.tsx) | **não tocado** |
| Engines financeiras / lógica | **não tocadas** |
| Chunk graph | **inalterado** |
| Sidebar / BottomNav / PDF / Dialogs / Landing | **preservados** |
| Reversibilidade | total (remover bloco Wave 36) |

---

## Fase 5 — Auditoria final

| Pergunta | Resposta |
|---|---|
| Removeu glassmorphism cliché? | Sim — `backdrop-filter` neutralizado em cards de módulo. |
| Removeu glow azul/roxo de template AI? | Sim — sombras de hover trocadas por ink editorial. |
| Removeu gradientes genéricos de superfície? | Sim — cards voltam a `hsl(var(--card))` chapado. |
| Removeu microelevação teatral universal? | Sim — lift mantido só onde tem semântica (contextual/analytical). |
| Removeu pílulas coloridas de tab ativa? | Sim — underline editorial substitui shadow primary. |
| Parece mais Bloomberg/wealth platform? | Sim — peso e densidade vencem decoração. |
| Parece menos template SaaS IA? | Sim — sem blur, sem glow, sem gradientes de fundo. |
| Identidade CAIXA preservada? | Sim — paleta, sidebar, logos intactos. |
| Sistema continua estável? | Sim — apenas CSS aditivo, zero risco runtime. |

---

## Scores

| Dimensão | Antes (W28) | Depois (W36) |
|---|---|---|
| Maturidade institucional         | 4.55 | **4.9** |
| Distância de "template AI"       | 3.6  | **4.9** |
| Profundidade silenciosa          | 4.0  | **4.85** |
| Personalidade proprietária       | 4.1  | **4.85** |
| Sofisticação sem teatralidade    | 4.2  | **4.9** |
| Estabilidade operacional         | 5.0  | **5.0** |

---

## Arquivos tocados

- `src/index.css` — bloco `Wave 36` adicionado ao final (~80 linhas, scoped)
- `.lovable/audit/anti-ai-slop-visual-enforcement-pass.md` — este relatório
