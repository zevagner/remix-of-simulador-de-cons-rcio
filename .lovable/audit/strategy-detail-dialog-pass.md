# Strategy Detail Dialog Pass

## Problema
Expansão inline em `StrategyLibrarySection` deslocava a linha do grid e empurrava o card clicado para fora da viewport; segundo disclosure ("Aprofundar análise") empilhava rolagem sobre rolagem.

## Solução
- Removido `open` / `showDetails` por card.
- Botão "Abrir estratégia completa ▾" → **"Ver estratégia completa →"** abre um `<Dialog>` focado (`max-w-[880px]`, `max-h-[88vh]`, header sticky, body com rolagem interna).
- Card fechado mantém intacto: header, tagline, `ViabilityPreview` (cálculos), `contextHint`.
- Conteúdo expandido (racional, apoio à decisão, leitura patrimonial, vantagens, riscos, cálculos, cenários, comparativos) movido para `<StrategyDetailDialog>`, agora sem segundo disclosure — overlay focado já é o disclosure.
- Compra à Vista mantém ordem simulação-first.

## Garantias
- Zero alteração em `strategyLibraryData.ts`, engines, fórmulas, KPIs ou cálculos.
- Apenas reorganização de container (apresentação).
- Acessibilidade entregue pelo shadcn `Dialog` (trap de foco, ESC, `aria-labelledby`).
- Grid (`auto-rows-fr`) permanece estável — nenhuma row cresce ao abrir uma estratégia.

## Arquivos
- `src/components/modules/wealth/StrategyLibrarySection.tsx` (refactor de container).
