# Flagship Cash Purchase Experience Restoration Pass

## Resumo

Restaurada a sensação de **engenharia patrimonial premium** no tab `Comparador → vs Compra à Vista`, sem clonar o layout antigo e sem engine paralela. Toda a matemática continua no hook canônico `useCashComparison` (mesmo usado por Investimentos), alimentado por fontes oficiais (`SimulatorContext` + `WealthAssumptionsContext`).

---

## Restore 3-Layer Financial Flow

Grid `lg:grid-cols-3` com três camadas conceituais:

- **Camada 1 — Compra à Vista** (referência): valor do imóvel + patrimônio final simples.
- **Camada 2 — Estratégia Patrimonial** (coração, destacada com borda primary): carta dobrada, "Como funciona", lance embutido, lance livre, capital investido, parcela, rendimento, premissas, reinvestimento.
- **Camada 3 — Resultado Patrimonial**: resultado mensal, patrimônio bruto/IR/líquido, vantagem do consórcio.

Mobile-first: stacka em coluna única abaixo de `lg`. Touch targets ≥44px (PercentInput + Checkbox).

## Restore "Como essa estratégia funciona"

Bloco educacional consultivo dentro da Camada 2, com lista ordenada de 4 passos populados com valores reais e vivos (formatCurrency da carta, embedded/free atual, capital remanescente). Tom executivo, sem marketing.

## Restore Premises Visibility

Card dedicado "Premissas da estratégia" (Compass eyebrow) com grid de 6+ premissas visíveis: **Prazo · CDI a.a. · % do CDI · Contemplação · Taxa adm. · Fundo reserva · IR (15%) · Seguro prestamista**. Microcopy explícito: "alteradas em Estratégias Patrimoniais → Premissas da Simulação propagam aqui automaticamente". Elimina "número mágico".

## Restore Narrative Summary

Seção "Resumo narrativo executivo" abaixo do grid: 3 parágrafos humanos (aquisição → renda mensal vs parcela → patrimônio final), 2 cards comparativos lado a lado (Patrimônio à vista × Patrimônio consórcio) e card hero da Diferença Patrimonial. Disclaimer canônico no rodapé.

## Maintain Live Engine

- Engine = `useCashComparison()` (hook canônico, mesmo do InvestmentModule). Zero recálculo local, zero shadow math.
- Inputs canônicos:
  - `SimulatorContext` → `creditValue`, `termMonths`, `adminFeePercent`, `reserveFundPercent`, `insuranceEnabled`, `monthlySchedule` (para `totalInsurance` real).
  - `readWealthCalcContextFromStorage()` → CDI, %CDI, contemplationMonth (premissas vivas).
  - Local controls: `embedded%`, `free%`, `reinvest` (engineering inputs específicos desta vista).
- Reatividade Wealth: `useEffect` com `focus` + `storage` listeners re-lê o snapshot quando o usuário volta ao tab após editar premissas no Wealth.
- Defaults sem simulação: 300k / 200m / 22% adm / 2.5% FR, transparente via banner amarelo no header.

## Executive Visual Refinement

- Linguagem visual idêntica à `StrategyLibrarySection` (eyebrows uppercase `tracking-[0.22em]`, hairlines `border-border/60`, `tabular-nums` em todos os valores, tokens semânticos primary/success/destructive).
- Camada 2 com `border-primary/30` + `bg-primary/[0.025]` (peso visual de "coração da experiência").
- Hierarquia tipográfica: hero values `text-[22px] font-bold`, rows `text-[12.5px]`, eyebrows `text-[10.5px]`, narrative `text-[14px] leading-[1.65]`.
- Zero card-stack pesado; tudo em rounded-2xl com padding consistente.

## Mobile Validation

- `grid-cols-1 lg:grid-cols-3` — ordem narrativa preservada (referência → engenharia → resultado).
- Premises em `grid-cols-2 sm:grid-cols-3` evita overflow em 320px.
- Narrative summary `grid-cols-1 sm:grid-cols-2`.
- Hero values `text-[20px] md:text-[22px]` evita estouro de container.

## Comparative Integrity Validation

- Comparador (Financiamento / Outro Consórcio) intacto — apenas o tab `cash` foi reescrito.
- Investimentos → Compra à Vista permanece intocado (`investment/CashComparisonTab.tsx` não modificado).
- Wealth permanece intacto — apenas leitura do storage (já era o contrato oficial do `readWealthCalcContextFromStorage`).
- Proposal PDF não afetado (consome `useProposalData()` independente).

## Zero Regression Validation

| Regra | Estado |
|-------|--------|
| Layout antigo literal? | ✗ Não — composição moderna, mesma linguagem do Wealth |
| Engine paralela? | ✗ Não — `useCashComparison` canônico |
| Shadow math? | ✗ Não — `DEFAULT_ASSUMPTIONS` + premissas oficiais |
| UX moderna quebrada? | ✗ Não — eyebrows/tabular-nums/tokens preservados |
| Cálculo duplicado? | ✗ Não — hook único, primitivas core/finance |
| Performance? | ✓ `useMemo` no Assumptions, snapshot Wealth via eventos (sem polling) |
| Build? | ✓ Passou (21.96s, sem erros) |

## Final Experience State

**Antes**: tabelas estáticas de Cálculos + Comparativos (234 linhas) — comparador simplificado sem leitura operacional.

**Depois**: 3 camadas vivas, "Como funciona" populado com valores reais, premissas explícitas, resumo narrativo executivo, KPIs dinâmicos — engenharia patrimonial visível e auditável.

## Final Verdict

✅ **Compra à Vista voltou a parecer engenharia patrimonial premium** — não apenas mais um comparador financeiro. A jornada conceitual (referência → engenharia → consequência) é legível, vivamente parametrizada, e respeita os locks canônicos da plataforma.
