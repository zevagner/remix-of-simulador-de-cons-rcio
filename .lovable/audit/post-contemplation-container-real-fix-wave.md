# Wave 21 — Post-Contemplation Container Real Fix

## Problema
O chapter `data-spatial-zone='board'` (Pós-Contemplação) estava com
`max-width: none; margin-inline: 0;` desde a Wave 19. Resultado: container
ocupava 100% do shell e, com a stage interna + grid 8/4, parecia "card
pequeno colado à esquerda + canvas vazio gigante à direita".

## Correção (CSS-only, src/index.css)
Mudança composicional única — sem novos efeitos, sem mexer no card interno,
sem novos systems:

| Breakpoint | Antes (board) | Depois (board) |
|---|---|---|
| ≥1100px | `max-width: none` | `max-width: 1120px; margin-inline: auto` |
| ≥1440px | (none)            | `max-width: 1240px` |
| ≥1680px | (none)            | `max-width: 1320px` |

Larguras alinhadas com `analytical` e `conversion` → continuidade
arquitetural: o gráfico abaixo (analytical) segue a mesma medida do board.

## Resultado visual
- Chapter Pós-Contemplação centralizado horizontalmente.
- Vazio direito eliminado (largura intencional, não 100% do shell).
- Gráfico abaixo alinhado ao mesmo eixo editorial.
- Stage cinematográfica da Wave 20 preservada, agora dentro de um
  container dimensionado.

## Estabilidade
- 100% CSS, ~6 linhas tocadas. Sem JSX, runtime, lógica financeira,
  vite.config ou chunks. Print mantém neutralização (Wave 19).

## Correção adicional — causa real encontrada
O card continuava visualmente preso à esquerda quando `SimulatorBidImpactCard`
retornava `null`: a célula `primary` seguia ocupando 8/12 colunas do grid,
mas ainda começava na coluna 1. O espaço vazio à direita era a célula secundária
ausente, não o card interno.

Correção aplicada:
- `SimulatorModule` agora marca o grid como `data-spatial-board-layout='single'`
  quando não existe impacto de lance renderizável.
- Nesse estado, a célula `primary` usa `grid-column: 3 / span 8`, centralizando
  o card no board.
- Quando o impacto de lance existe, o layout volta para `split` e preserva a
  composição 8/4 original.

Validação visual em desktop 1280×720: o card Pós-Contemplação agora aparece
centralizado horizontalmente dentro do chapter, sem ficar colado à esquerda.
