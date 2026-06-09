# Strategy Registry Recovery & Reintegration Pass

**Estratégia recuperada:** *Usar a Carta para Investir*
**Escopo:** Registry/data only — engine financeira intocada.

---

## Full Strategy Registry Trace

Trace completo via `rg "Carta para Investir|usar-carta|quick-contemplation"`:

| Localização | Status anterior |
|---|---|
| `src/components/modules/investment/useInvestmentScenarios.tsx:72` | ✅ presente — id `quick-contemplation`, path 5 do simulador de Análise |
| `src/components/modules/strategy-v2/blueprint.ts:252` | ✅ presente — `INVESTMENT_BLUEPRINTS`, categoria `estrategico`, KPI hero `absoluteGain` |
| `src/components/modules/wealth/strategyLibraryData.ts` | ❌ **AUSENTE** — nunca integrada à biblioteca patrimonial das 24 teses |
| `strategyExecutiveKpis.ts` / `strategyModalities.ts` / `strategyContextScoring.ts` / `strategyFlagships.ts` | ❌ **AUSENTE** — sem KPI canônico, sem modalidade, sem boost contextual, sem flagship |

**Diagnóstico:** estratégia NÃO foi removida. Estava **órfã do registry da Wealth Library** — vivia exclusivamente no Analysis/Investment como cenário (`quick-contemplation` path 5) e como blueprint v2 (`estrategico`), porém sem entrada nas 24 teses do módulo *Estratégias Patrimoniais*. Após a reorganização editorial em capítulos + flagship + selector contextual, a ausência ficou perceptível porque nenhuma camada de descoberta a indexava.

---

## Canonical Data Validation

Reintegração usa **exclusivamente primitivas canônicas** já importadas em `strategyLibraryData.ts`:

| Valor | Fonte canônica |
|---|---|
| Carta de crédito | `brl(c)` |
| Custo total no consórcio | `c × ADM_TOTAL` (derivado de `computeAdminFee` + `computeReserveFund` + `computeBaseCost`) |
| Saldo aplicado final | `compoundGrowthAnnualMonthly(c, CDI_LIQ, REF_TERM_M - 24)` |
| Lucro líquido | `saldo aplicado − custo total` |
| ROI | `lucro ÷ custo total` |

Constantes reutilizadas (sem redeclarar): `CDI_LIQ`, `REF_TERM_M=200`, `ADM_TOTAL`, `FIN_RATE_AA`. Contemplação ilustrativa **mês 24** = mesma referência do `contemplationMonthOverride` default no simulador (Análise path 5).

**Zero math nova. Zero engine paralela. Zero KPI canônico modificado.**

---

## Editorial Reintegration

Nova entrada `id: 'usar-carta-investir'` em `strategyLibraryData.ts` (após `leverage-patrimonial`), com:

- **Chapter:** `Leverage` (Capítulo II — *Multiplicação patrimonial*)
- **Priority:** 2 (após `leverage-patrimonial`)
- **Icon:** `Wallet` (mesmo icon usado no blueprint v2)
- **Accent:** `primary`
- **Conteúdo editorial:** howItWorks, patrimonialLogic, liquidityImpact, timing, advantages, risks, commonMistakes, whenNotToUse, scenarios, comparisons — todos preenchidos no mesmo padrão consultivo das 24 teses existentes.

Wiring nas camadas auxiliares:

| Arquivo | Entrada adicionada |
|---|---|
| `strategyExecutiveKpis.ts` | `profit` (hero) · `roi` · `finalPatrimony` — KPIs canônicos já existentes |
| `strategyModalities.ts` | `['imobiliario', 'veiculos', 'pesados']` — tese é universal (carta de qualquer modalidade aplicável a CDI) |
| `strategyContextScoring.ts` | Boost em `objetivoPrincipal='investimento'`, `subObjetivo='patrimonio'`, `prioridade='manter_liquidez'` |
| `strategyFlagships.ts` | **Promovida a Flagship #1** (substitui `leverage-patrimonial` no slot 4; este permanece visível em capítulo + ordering) |

---

## Discovery Validation

Pontos de descoberta natural pós-reintegração:

| Caminho | Comportamento esperado |
|---|---|
| Flagship Layer (topo da Wealth) | **#1 — "Usar a Carta para Investir"** com tese em serif italic |
| Recommended Layer (cenário ativo `investimento` / `patrimonio` / `manter_liquidez`) | Top 3 contextual (boost ≥1) |
| Capítulo II — Multiplicação patrimonial | 2º card (priority=2) |
| Modalidade *Imobiliário / Veículos / Pesados* | Visível em todas (tese universal) |
| Ordenação "Maior lucro estimado" / "Maior ROI" / "Maior patrimônio estimado" | Sobe naturalmente (KPI hero = `profit`) |
| Dialog completo | Same `StrategyDetailDialog` reutilizado — cálculos, decisão, comparativos, continuidade consultiva |

---

## No Duplication Validation

- ✅ ID único `usar-carta-investir` — `rg "id: 'usar-carta-investir'"` retorna apenas a entrada nova.
- ✅ Sem colisão com `quick-contemplation` (Investment) ou com `escada-patrimonial` (Venda da Carta — tese conceitualmente distinta: vender ≠ aplicar).
- ✅ Sem shadow version, sem alias conflitante.
- ✅ Conteúdo editorial inédito nesta biblioteca — não é cópia de outra entrada.
- ✅ KPIs apontam para `calculations[]` da própria estratégia (sem reuso cruzado de índices).

---

## UX Integrity Validation

- ✅ Hierarquia editorial (Hero → Flagship → Recommended → Chapters) preservada — apenas slot #1 do flagship trocou.
- ✅ Capítulos intactos — Capítulo II ganhou +1 card (de 3 para 4 estratégias visíveis).
- ✅ Narrativa consultiva mantida — eyebrow + numerais romanos + tese serif italic seguem o mesmo padrão.
- ✅ Scanning intacto — grid `md:grid-cols-2` aceita 4 flagship sem distorção (2×2).
- ✅ Compra à Vista continua filtrada (movida ao Comparador) — sem regressão.
- ✅ Modalidade `Imobiliário` (sugerida pelo simulador imob) prioriza a tese, mas ela permanece visível em qualquer modalidade.

---

## Zero Regression Validation

- ✅ `src/core/finance/**` — não tocado.
- ✅ `useInvestmentScenarios.tsx` (path 5 / `quick-contemplation`) — não tocado.
- ✅ `strategy-v2/blueprint.ts` (INVESTMENT_BLUEPRINTS) — não tocado.
- ✅ KPI canônicos (`ExecutiveKpiKind`, `EXECUTIVE_KPI_DEFAULT_SOURCE`, hints) — não tocados.
- ✅ 24 estratégias existentes — nenhuma modificada, apenas adicionada a 25ª.
- ✅ TypeScript build limpo (`tsc --noEmit` → 0 erros).
- ✅ Ordering / capítulos / modalidades / recommended layer / dialog — comportamentos preservados.

---

## Final Strategy Integrity State

| Camada | Antes | Depois |
|---|---|---|
| Investment Analysis (path 5) | ✅ presente | ✅ presente (inalterado) |
| Strategy V2 blueprint | ✅ presente | ✅ presente (inalterado) |
| **Wealth Library Registry** | ❌ órfã | ✅ **integrada** (`usar-carta-investir`) |
| KPIs canônicos | ❌ sem mapping | ✅ `profit/roi/finalPatrimony` |
| Modalidade selector | ❌ não indexada | ✅ imob + veic + pesados |
| Context scoring | ❌ sem boost | ✅ 3 sinais (objetivo/sub/prioridade) |
| Flagship Layer | ❌ ausente | ✅ **slot #1** |
| Chapter Leverage | ❌ ausente | ✅ priority=2 |

---

## Final Verdict

A estratégia **"Usar a Carta para Investir" estava órfã do registry da Wealth Library** — viva no Analysis (path 5) e no blueprint v2, porém invisível ao módulo *Estratégias Patrimoniais* desde sua reorganização editorial em capítulos.

Foi **reintegrada como 25ª tese canônica** com flagship slot #1, capítulo II, KPIs canônicos (`profit/roi/finalPatrimony`), modalidades universais e boost contextual em 3 sinais do diagnóstico. **Toda a matemática vem de primitivas já existentes em `@/core/finance`** — zero engine paralela, zero KPI inventado, zero duplicação.

A tese agora é descoberta naturalmente em 6 caminhos (flagship, recomendadas, capítulo, modalidade, 3 modos de ordenação executiva), preservando integralmente a UX premium, a hierarquia editorial e a narrativa consultiva.
