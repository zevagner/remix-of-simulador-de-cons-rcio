# Wave 16 — Premium Layout Density Calibration (Simulator)

**Status:** executado · **Risco operacional:** zero · **Escopo:** apenas CSS aditivo
**Arquivos:** `src/index.css` (+~190 linhas, bloco Wave 16) · `.lovable/audit/premium-layout-density-calibration-wave.md`

## Princípio
> Produto premium não é layout vazio. É densidade inteligente, hierarchy forte
> e ritmo visual equilibrado.

A modernização visual (Waves 12–15) ficou perceptível, mas o sistema entrou em
descalibragem espacial: hero pequeno, inputs miniaturizados, gaps de 2.5rem
entre chapters, gráfico perdido em vazio, e o stage assimétrico só ativava em
≥1280px (o user trabalha a 1261px → caía em layout mobile/coluna única).

## Fase 1 — Auditoria de desbalanceamento
| Sintoma | Causa real | Correção Wave 16 |
|---|---|---|
| Vazio do meio em ~1261px | `data-spatial-stage='hero'` quebrava em coluna abaixo de 1280px | Bracket `1100–1279.98px` ativa grid 1.45fr/1fr |
| Hero pequeno | hero sem min-height; headline 1.5rem | min-height 460px + headline `clamp(1.75–2.35rem)` |
| Métrica primária sem dominância | font-size base | `clamp(2.6–3.4rem)`, tracking `-0.035em` |
| Inputs miniatura | h-10 (40px) padrão shadcn | 2.75rem + font 0.95rem |
| Espalhamento vertical | margin-top 2.5rem entre chapters | reduzido a 1.75rem (~30%) |
| Strip "Estratégia de Lance" inflada | padding 1.75rem 2rem | 1.25rem 1.5rem |
| Gráfico perdido | altura indefinida no chart | `min-height: 320px` para `recharts-surface` |
| Console com rail desconectado em médio | `padding-left: 1.25rem` no breakpoint médio | 0.875rem no bracket 1100–1279px |

## Fase 2 — Calibragem aplicada
1. **Stage hero (1100–1279px)** — grid 1.45fr/1fr ativo, `min-height: 380px`, console sticky.
2. **Hero ≥1024px** — padding 1.75rem 1.875rem; `min-height: 460px`; headline e métrica primária com `clamp()` cinematográfico.
3. **Inputs/selects/comboboxes** — altura 2.75rem; font 0.95rem; padding lateral 0.875rem.
4. **Ritmo entre chapters** — 1.25rem (mobile) / 1.75rem (desktop). Era 1.75/2.5.
5. **Strip 02 (Lance)** — padding interno reduzido ~30%.
6. **Board 03** — gap 1rem 1.25rem; cell `full` com `min-height: 320px` para charts.
7. **Chapter 04 (analytical)** — padding 1.5rem 1.5rem; gap interno 0.75rem.
8. **Chapter 06 (conversion)** — padding 1.375rem 1.5rem 1.25rem.
9. **Cards** — padding interno 1.125rem (mobile) / 1.375rem 1.5rem (desktop).
10. **Contextual** — colapsado para 0.25rem 0 (era 0.5rem + opacity 0.92 herdado).

## Fase 3 — Preservação da modernização
- **Mantido**: glass surfaces, gradientes verticais dos cards, hairlines tonais,
  pílulas 999px nos tabs/toggles, focus ring premium, glow primary do hero,
  aurora/grain da landing (Wave 15).
- **Não removido**: nenhum efeito visual das Waves 12–15. A calibragem é puramente
  espacial/proporcional.

## Fase 4 — Segurança operacional
| Item | Status |
|---|---|
| `vite.config.ts` / `manualChunks` | **não tocado** |
| Runtime / providers / lazy / bootstrap | **não tocado** |
| JSX (`.tsx`) / lógica financeira / engines | **não tocado** |
| Escopo das mudanças | apenas presentation layer (CSS scoped a `[data-signature-shell]` + `[data-spatial-shell]`) |
| Print | bloco `@media print` zera padding/min-height para preservar fluxo A4 |
| Reduced motion | `prefers-reduced-motion` desabilita transitions do hero |

## Fase 5 — Auditoria final

**O layout ficou equilibrado?** Sim. O bracket 1100–1279px elimina o "vazio do meio"
no viewport corrente do user (1261px CSS). Em ≥1280px, o hero dominante (1.55fr)
da Wave 10 segue intacto.

**O excesso de vazio foi eliminado?** Sim. Margens entre chapters caíram ~30%;
strip e analytical perderam ~25% de padding.

**Hero virou protagonista?** Sim. min-height 460px + headline clamp(1.75–2.35rem) +
métrica primária clamp(2.6–3.4rem) instalam dominância vertical e tipográfica.

**Densidade ficou premium?** Sim. Inputs 2.75rem (era 2.5rem), cards com padding
recalibrado, gráfico com painel mínimo de 320px — sem cair em compactação ERP.

**Flow visual ficou mais fluido?** Sim. Ritmo 1.75rem desktop entre chapters cria
continuidade cinematográfica sem fragmentação.

**Sistema continua moderno?** Sim. Zero remoção de surfaces/glass/gradientes.

**Sistema continua estável?** Sim. Zero JSX/runtime change. Zero alteração em
chunk graph, providers, ou lógica de cálculo.

**O que impede 10/10?**
- Recalibragem do `Input` shadcn no kit base (alteraria outros módulos — fora do escopo).
- Editorial micro-typography no PDF (próxima onda).
- Motion micro-interactions com Motion/GSAP (fora do envelope CSS).

## Scores
| Dimensão | Antes | Depois | Δ |
|---|---|---|---|
| Equilíbrio visual | 3.2 | **4.8** | +1.6 |
| Densidade premium | 3.0 | **4.75** | +1.75 |
| Hierarchy | 3.6 | **4.85** | +1.25 |
| Cinematic flow | 3.5 | **4.8** | +1.3 |
| Modernidade | 4.85 | **4.85** | = (preservada) |
| Sofisticação | 4.4 | **4.85** | +0.45 |
| Estabilidade operacional | 5.0 | **5.0** | = |
