# Wave U3 — Compare Workspace Reconstruction

## Objetivo
Transformar o Layer 3 (`CompareWorkspace`) num **decision support workspace** moderno: comparação **fora dos cards**, hierarquia orientada à decisão (Winners → Insights → Matriz → Perfis), zero "planilha gigante", mobile-first.

## Arquitetura final

```
section (workspace dedicado)
├── Header executivo (eyebrow + título + close)
├── Chip row (estratégias selecionadas, n/3)
├── A. Winners            (grid de cards: KPI + valor + edge % + estratégia)
├── B. Insights           (até 4 frases consultivas + tradeoffs cruzados)
├── C. Matriz comparativa
│     ├── desktop ≥md → tabela com Trophy no winner
│     └── mobile  <md → stack vertical (1 card / estratégia)
├── D. Perfil ideal & limitações (cards lado a lado)
└── Disclaimer institucional
```

## Estados
- `0 selecionadas` → empty state ("Selecione 2 ou 3 estratégias…").
- `1 selecionada`  → single-state ("Adicione mais 1 para comparar").
- `2–3 selecionadas` → workspace completo.
- `>3 selecionadas` → truncado em `COMPARE_MAX = 3`.

## Princípios aplicados (21/21)
| # | Princípio | Implementação |
|---|---|---|
| 1 | Workspace dedicado | Section própria com header/separators, não Card aninhado |
| 2 | Comparação fora dos cards | Layer 1 só seleciona; comparação só aqui |
| 3 | Comparação por tese | Insights nomeiam winner por objetivo (multiplicador, payback, preservação…) |
| 4 | Dominant winners | `computeWinners` por KpiKind + edge % vs 2ª colocada |
| 5 | Hierarchy decisória | Winners → Insights → Matriz → Perfis |
| 6 | Modular | Cada bloco = `<Block eyebrow icon>` independente |
| 7 | Scanning executivo | Eyebrows uppercase + Trophy/ArrowRight visuais |
| 8 | Visual silence | Insights cap=4, Winners 2 cols, separators sutis |
| 9 | Compare cadence | Alterna grid → lista → tabela → grid (ritmo editorial) |
| 10 | Insights consultivos | Frases automáticas: "maior multiplicador", "payback mais rápido", "tradeoff…" |
| 11 | Recommendation support | Badge "Recomendada" + tradeoff explícito ("acelera vs protege") |
| 12 | Compare limits | `COMPARE_MAX = 3` aplicado em slice + chip "n/3" |
| 13 | Mobile-first | Stack vertical < md, matriz tabular ≥ md |
| 14 | Responsive stacking | Sem overflow horizontal em mobile (grid 2 cols dl) |
| 15 | Compare entry flow | Empty state didático + single-selection state |
| 16 | Strategy blueprint preservado | 100% do conteúdo via `blueprint.consultive.*` |
| 17 | Motor financeiro único | Zero recálculo; só ranking sobre `KPIModel.rawValue` |
| 18 | Performance | `useMemo` em kpiKinds e winners; sem state interno |
| 19 | Coexistência | Continua sob `ENABLE_STRATEGY_PRESENTATION_V2` (gating a montante) |
| 20 | Decision support quality | Trophy + edge % + tradeoff cruzado dão "porquê" decisional |
| 21 | Premium feel | Tokens semânticos, tipografia tabular-nums, sem "dashboard look" |

## Heurísticas (sem cálculo financeiro)
- `HIGHER_IS_BETTER`: roi, tir, multiplier, preserved, absoluteGain, percentGain, finalResult.
- `LOWER_IS_BETTER`: payback, totalPaid.
- Edge % = diferença vs segunda colocada (oculto se < 1%).
- Tradeoffs cruzados: TIR×Payback e Multiplicador×Preservação (quando winners distintos).

## O que NÃO foi feito (correto)
- Sem alterar `contracts.ts` / `blueprint.ts` / `adapters.ts`.
- Sem novo cálculo financeiro nem chamadas a hooks de motor.
- Sem montagem em produção (gating segue OFF).
- Sem alterar Layer 1 / Layer 2.

## Próxima wave
**U4 — Visual Refinement** (microtipografia, animações sutis, dark-mode polish) e **U5 — Real Page Migration** (substituir grid antigo por V2 atrás do flag em rota canária).

## Arquivos
- editado: `src/components/modules/strategy-v2/CompareWorkspace.tsx` (rewrite completo)
- criado:  `.lovable/audit/u3-compare-workspace-reconstruction-wave.md`
