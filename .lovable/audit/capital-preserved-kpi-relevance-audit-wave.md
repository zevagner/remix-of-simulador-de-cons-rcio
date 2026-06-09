# Capital Preserved KPI Relevance Audit Wave

## Princípio absoluto

KPI sem valor consultivo NÃO deve existir. "Capital Preservado = R$ 0,00" não é informação — é ruído que polui scanning, quebra credibilidade e dá sensação de KPI forçado.

## Diagnóstico

A camada de KPIs executivos exibia "Capital Preservado" em cenários onde:

1. **Não há lance embutido nem caixa retido** → o cálculo `max(0, credit − totalPaid)` cai a R$ 0,00 quando o cliente paga todas as parcelas (cenário `traditional` e `rental` com simulação completa).
2. **A tese da estratégia é outra** → mostrar Preservado em "Aluguel" ou "Construção" sugere um benefício que a estratégia, de fato, não entrega.

## Auditoria estratégia por estratégia

### Investimentos · `scenarioExecutiveKpis.ts`

| Cenário | Antes | Depois | Justificativa |
|---|---|---|---|
| `investment` (Carta como Investimento) | ROI · TIR · Mult | ROI · TIR · Mult | Já estava sem Preserved. ✅ |
| `traditional` (Uso/Valorização) | Mult · **Preserved** | Mult | Sem lance embutido o Preservado = R$ 0,00. Multiplicador SOZINHO É a tese ("patrimônio ÷ aporte"). |
| `sale` (Venda da cota) | Payback · ROI | Payback · ROI | Já estava sem Preserved. ✅ |
| `rental` (Aluguel) | Payback · **Preserved** · Mult | Payback · Mult | Aluguel não preserva capital — paga parcela. Preservado caía a R$ 0,00 e poluía o card. |
| `quick-contemplation` (Lance) | ROI · Preserved | ROI · Preserved (com guard) | Mantido — preservar caixa via lance embutido É a tese. Suprimido em runtime quando valor = 0. |
| `previdencia-turbinada` | Mult · ROI | Mult · ROI | Já estava sem Preserved. ✅ |

### Engenharia Patrimonial · `strategies.ts`

| Estratégia | Antes | Depois | Justificativa |
|---|---|---|---|
| Autoquitação | payback · mult · roi | payback · mult · roi | Sem Preserved. ✅ |
| **Escada Patrimonial** | mult · tir · **preserved** | mult · tir · **payback** | Cartas escalonadas distribuem contemplações; payback recorrente é coerente. Preservado caía a R$ 0,00. |
| Renda Passiva | payback · roi · mult | payback · roi · mult | Sem Preserved. ✅ |
| **Construção Inteligente** | mult · roi · **preserved** | mult · roi · **payback** | Construção consome caixa em obra; payback é a métrica honesta. |
| Multiplicação de Ativos | mult · **preserved** · tir | mult · **preserved** · tir | KEEP — lance embutido + reaplicação É a tese central. |
| Holding & Sucessão | mult · **preserved** · roi | mult · **preserved** · roi | KEEP — estrutura PJ com lance embutido preserva caixa para sucessão. |

## Salvaguardas de runtime

Mesmo após o rebalanceamento, dois guards finais garantem que nenhum "R$ 0,00" passa para a UI:

1. **`ExecutiveKpiStrip.tsx`** — filtra `preserved` do `secondary` quando `kpis.preservedCapital ≤ 0`. Cobre o `quick-contemplation` sem lance embutido.
2. **`PatrimonialStrategyCard.tsx`** — filtra chip `preserved` quando valor ≤ 0. Cobre Multiplicação/Holding em simulações sem lance.
3. **`PatrimonialKpiBar.tsx`** — KPI "Capital preservado" some quando ≤ 0; grid alterna estaticamente entre 5 e 4 colunas (sem Tailwind dinâmico).

## Resultado

- **Antes:** até 8 ocorrências possíveis de "Capital Preservado" entre Investimentos + Patrimonial, várias caindo a R$ 0,00.
- **Depois:** 4 ocorrências no design (1 em Investimentos: `quick-contemplation`; 2 em Patrimonial: Multiplicação, Holding; 1 no KpiBar do cliente atual). Todas com guard runtime contra zero.

## Hierarquia preservada

- `ExecutiveKpiStrip`: 1 primary + até 2 secondary (limite mantido). Cards com 1 KPI secondary continuam usando `grid-cols-1`, com 2 usam `grid-cols-2` — densidade visual coerente.
- `PatrimonialStrategyCard`: chips em `flex-wrap`, então 2 ou 3 chips fluem naturalmente sem buraco.
- `PatrimonialKpiBar`: alterna 4 ↔ 5 colunas via mapa estático, preservando a regra "no dynamic Tailwind".

## Escopo preservado

- Nenhuma alteração em `@/core/finance` (engines, fórmulas, motor mensal).
- Nenhuma alteração em providers, contexts, Supabase, edges.
- Nenhuma alteração em `usePatrimonialKpis` ou `decisionDeskInsights` (cálculos intactos).
- `PatrimonialTimeline` continua exibindo "Capital preservado" no tooltip (contexto longo, não card hero — informação consultiva válida).
- `KpiEducationCard` mantém a definição educacional de "Capital Preservado".

## Arquivos alterados

- `src/components/modules/investment/scenarioExecutiveKpis.ts` — blueprints `traditional` e `rental` sem `preserved`.
- `src/components/modules/investment/ExecutiveKpiStrip.tsx` — filtro runtime de `preserved` quando ≤ 0.
- `src/components/modules/patrimonial/strategies.ts` — `escada-patrimonial` e `construcao-inteligente` trocam `preserved` por `payback`.
- `src/components/modules/patrimonial/PatrimonialStrategyCard.tsx` — filtro runtime de chip `preserved` quando ≤ 0.
- `src/components/modules/patrimonial/PatrimonialKpiBar.tsx` — KPI "Capital preservado" condicional + grid 4/5 estático.
