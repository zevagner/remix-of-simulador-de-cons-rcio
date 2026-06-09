# Complete Strategy UX Refinement Pass

Escopo: `src/components/modules/wealth/StrategyLibrarySection.tsx`.
Sem novas arquiteturas, sem nova taxonomia, sem novo motor — apenas polishing visual/UX.

## Visual Cleanup Applied

- Bordas dos cards padronizadas em `border-border/60` (eliminado mix de bordas tonais que poluía o grid).
- Sombras suavizadas: `shadow-[0_1px_2px_rgba(0,0,0,0.04)]` em repouso, `shadow-md` no hover/aberto.
- Anel de foco aberto reduzido para `ring-*/20` (menos peso visual).
- Padding interno aumentado para `p-5 md:p-6` (era `p-4 md:p-5`).
- Gap do grid elevado para `gap-5 md:gap-6` para mais respiro entre cards.

## Card Rhythm Refinement

- `auto-rows-fr` no grid + `flex-1` no header garantem **altura perceptiva uniforme** entre cards quando fechados.
- Tagline normalizada com `line-clamp-3` + `min-h-[3.6em]` — todas as 24 estratégias agora ocupam o mesmo bloco editorial.
- CTA "Abrir estratégia completa" ancorado num rodapé dedicado (`pb-5 md:pb-6`), sempre no mesmo Y perceptivo.
- Ícone do header padronizado em `h-10 w-10` com `rounded-xl` e ícone de 18px (antes 20px, levemente pesado).

## KPI Surface Refinement

- Tabelas de cálculos e comparativos migradas para estilo editorial (cabeçalho em uppercase 10.5px, linhas com `border-b border-border/30`, sem fundo cinza pesado).
- `tabular-nums` em todos os valores numéricos (resultados e Δ) para alinhamento de colunas.
- Fórmulas em `font-mono` 11.5px com cor `muted-foreground` — leitura técnica sem competir com o resultado.
- Resultado destacado com `font-semibold text-foreground`; Δ comparativo em `text-primary`.

## Expansion Experience Refinement

- Body expandido com `py-6 md:py-7` + `space-y-7 md:space-y-8` entre blocos (era `py-5 / space-y-5`).
- Blocos internos com hierarquia consistente: ícone 3.5×3.5 + título uppercase 11px + corpo 13.5px.
- "Lógica patrimonial / Impacto / Timing" agora renderizados via componente `<Definition>` — leitura limpa, sem `<strong>` espalhado.
- "Riscos / Erros / Quando NÃO usar" agrupados via `<SubGroup>` reutilizável, marcador de lista em `warning/60`.

## Content Rhythm Corrections

- Texto explicativo (`howItWorks`) abre o bloco e respira antes das definições rotuladas.
- Vantagens (primary) e Riscos (warning) ocupam grade 2-col em desktop, garantindo balanço cromático sem competir.
- Disclaimer dos cálculos reduzido para uma frase única em itálico 11px (era duas linhas).
- Cenários com padding `p-3.5` e fundo `muted/20` (era `muted/30`) — mais leve.

## Typography Refinement

Escala canônica adotada no módulo:
- Eyebrow: 10px uppercase tracking-[0.18-0.2em]
- H2 seção: 26/32px semibold tracking-tight
- H3 card: 15.5/16px semibold tracking-tight
- Tagline / corpo: 13–13.5px leading-relaxed
- Label bloco: 11px uppercase tracking-[0.14em]
- Sublabel: 10.5px uppercase tracking-[0.12em]
- Tabela: 12.5px corpo, 10.5px header

## Mobile Experience Refinement

- Grid colapsa para 1 coluna abaixo de `md` com padding generoso (`p-5`).
- Tabelas envolvidas em `overflow-x-auto -mx-1 px-1` — scroll horizontal nativo sem quebrar layout.
- Headers das tabelas em `pb-2` (sem fundo cinza), mantendo a leitura confortável em telas estreitas.
- Tagline com `line-clamp-3` evita cards com altura desproporcional em mobile.

## Strategic Chapter Flow

- Sequência editorial mantida (ordem definida em `STRATEGY_LIBRARY_ORDERED`, com as 7 estratégias prioritárias abrindo o módulo em mesmo nível).
- Capítulo (`chapter`) renderizado como eyebrow sutil no card — orienta sem hierarquizar.
- Nenhuma estratégia recebe destaque visual diferenciado — todas as 24 mantêm a mesma gramática.

## Modern Premium Pass

- Eliminado o visual "ERP/banco antigo" via:
  - bordas tonais → bordas neutras;
  - cabeçalhos de tabela com fundo cinza → cabeçalhos uppercase com linha inferior;
  - sombras pesadas → micro-sombra editorial.
- Adicionado `transition-all duration-200` nas interações para sensação premium consistente.

## Final Consistency Validation

- Todos os 24 cards usam a mesma estrutura: header (ícone + eyebrow + título + tagline) + CTA + body expandido idêntico.
- Tipografia, spacing, bordas, sombras e tabelas seguem a mesma escala em todas as estratégias.
- Nenhuma string de copy alterada — somente refinamento visual/UX.
- Nenhum cálculo, motor financeiro ou taxonomia alterados.

## Final Module State

- `WealthPlatformModule.tsx`: inalterado (header da plataforma + StrategyLibrarySection).
- `StrategyLibrarySection.tsx`: refinado conforme acima.
- `strategyLibraryData.ts`: inalterado (24 estratégias, ordem editorial preservada).

## Final Verdict

Módulo entregue como **plataforma patrimonial consultiva premium**: rítmica visual uniforme,
tabelas editoriais leves, hierarquia tipográfica clara e expansão respirada. Sem dashboardização,
sem catálogo poluído, sem visual bancário antigo.
