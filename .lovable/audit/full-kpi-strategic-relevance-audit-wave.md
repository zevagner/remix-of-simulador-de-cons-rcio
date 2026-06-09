# Full KPI Strategic Relevance Audit Wave

Auditoria completa das assinaturas de KPI executivos em **Investimentos** e
**Engenharia Patrimonial**, sob princípio absoluto:

> **KPI sem valor consultivo NÃO deve existir.**

---

## 1. Escopo

| Módulo | Superfície auditada | Fonte |
|---|---|---|
| Investimentos | 6 cenários do `SCENARIO_KPI_BLUEPRINT` | `src/components/modules/investment/scenarioExecutiveKpis.ts` |
| Engenharia Patrimonial | 6 estratégias do catálogo curado | `src/components/modules/patrimonial/strategies.ts` |
| KPI bar do cliente | `PatrimonialKpiBar` (4 ou 5 KPIs) | `src/components/modules/patrimonial/PatrimonialKpiBar.tsx` |

Engines, contextos, motores financeiros e providers — **intocados**.

---

## 2. Princípios da auditoria

1. Cada KPI deve responder a uma **pergunta consultiva real** da tese.
2. **2 KPIs** = padrão executivo. **3 KPIs** apenas quando a tese exige protagonismo triplo.
3. KPIs irrelevantes geram **ruído**, **fadiga cognitiva** e **quebra de credibilidade**.
4. KPIs que renderizariam `R$ 0,00` (ex: `preserved` sem lance embutido) já são suprimidos
   em runtime pelas guardas da Onda Capital Preserved Relevance Audit.

---

## 3. Investimentos — assinaturas (já curadas em ondas anteriores, validadas aqui)

| Cenário | Tese | Primary | Secondary | Justificativa |
|---|---|---|---|---|
| `investment` | Carta como veículo de aplicação | ROI | TIR · Multiplier | Sem ativo a recuperar e sem lance — payback/preserved removidos. |
| `traditional` | Imóvel para uso/valorização | Multiplier | — | Multiplier é toda a tese; ROI/TIR/Payback/Preserved não cabem. |
| `sale` | Venda da cota contemplada | Payback | ROI | Liquidez rápida; sem horizonte longo nem ativo retido. |
| `rental` | Aluguel paga parcela | Payback | Multiplier | Renda mensal já é a métrica narrada — ROI/TIR redundantes. |
| `quick-contemplation` | Lance para antecipar | ROI | Preserved (suprime ≤ 0) | Foco em "valeu o lance?" — preserved só renderiza quando há lance real. |
| `previdencia-turbinada` | Capitalização do crédito | Multiplier | ROI | Carta cresce no tempo; payback/preserved não compõem a tese. |

Status: **mantido**. 0 KPIs adicionais a remover.

---

## 4. Engenharia Patrimonial — auditoria por tese

### 4.1. Mapa antes × depois

| Estratégia | Antes (3 KPIs) | Depois | Δ Removido | Razão consultiva |
|---|---|---|---|---|
| `autoquitacao` | payback · multiplier · roi | **payback · multiplier** | `roi` | Em estratégia auto-quitada, "ganho" não é narrativa central — payback responde "quando se autossustenta?". |
| `escada-patrimonial` | multiplier · tir · payback | **multiplier · tir** | `payback` | Escalonamento é capitalização contínua, não breakeven — payback induz leitura errada. |
| `renda-passiva` | payback · roi · multiplier | **payback · roi** | `multiplier` | Foco é renda, não alavancagem; multiplier polui o pitch de "fluxo recorrente". |
| `construcao-inteligente` | multiplier · roi · payback | **multiplier · roi** | `payback` | Construção é vivência ou valorização, não recuperação de aporte. |
| `multiplicacao-ativos` | multiplier · preserved · tir | **multiplier · preserved · tir** | — | Mantido: 3 KPIs são todos protagonistas da tese de alavancagem. |
| `holding-sucessao` | multiplier · preserved · roi | **multiplier · preserved** | `roi` | Sucessão é proteção e legado — ROI consolidado polui a tese. |

**Resultado:** 4 das 6 estratégias agora usam **2 KPIs** (densidade premium);
apenas `multiplicacao-ativos` mantém 3 (justificado pela tese de alavancagem).

### 4.2. Princípio "Capital preservado"

Mesmo onde `preserved` integra a assinatura (`multiplicacao-ativos`,
`holding-sucessao`), o chip é **suprimido em runtime** quando o valor é
≤ 0 — invariância travada pela suíte
`src/test/capitalPreservedKpiRelevance.test.tsx`.

---

## 5. PatrimonialKpiBar (cliente atual)

KPI bar global do cliente — independe de estratégia. Assinatura mantida:

```
TIR (a.a.) · ROI · Payback · Multiplicador · [Capital preservado · se > 0]
```

Rebalanceamento 4 ↔ 5 colunas é determinístico (`lg:grid-cols-4` vs
`lg:grid-cols-5`) e travado por teste.

---

## 6. Coerência tooltip × card

Tooltips/explicações que ainda citavam "Capital preservado: R$ 0,00" foram
corrigidos na onda imediatamente anterior:

- `PatrimonialTimeline` (tooltip por marco): linha condicional `> 0`.
- `PatrimonialTimelineComparator` (tabela longitudinal): linha "Preservado"
  por estratégia só renderiza se algum marco tiver `preservedCapital > 0`.
- `InvestmentScenarioCard` (badge dominante): "Capital preservado dominante"
  só rotula quando há valor real.

---

## 7. Invariâncias travadas (testes)

Arquivo: `src/test/patrimonialKpiSignatures.test.ts` (15 testes).

| Invariante | Garantia |
|---|---|
| Cobertura | 6 estratégias presentes |
| Assinatura por estratégia | `kpis` exato vs blueprint curado |
| Densidade global | nenhuma estratégia > 3 KPIs |
| Densidade executiva | ≥ 4 estratégias com exatamente 2 KPIs |
| Coerência `renda-passiva` | NÃO contém `multiplier` |
| Coerência `escada-patrimonial` | NÃO contém `payback` |
| Coerência `construcao-inteligente` | NÃO contém `payback` |
| Coerência `holding-sucessao` | NÃO contém `roi` |
| Coerência `autoquitacao` | NÃO contém `roi` |
| Concentração `preserved` | só em `multiplicacao-ativos` e `holding-sucessao` |

Suíte adjacente `capitalPreservedKpiRelevance.test.tsx` (11 testes)
continua travando supressão runtime e coerência de tooltips.

**Resultado**: **26/26 testes verdes**.

---

## 8. Impacto esperado

- **−30% chips renderizados** em estratégias patrimoniais (média).
- **Hierarquia executiva**: protagonista visível em ≤ 2 segundos por card.
- **Identidade financeira**: cada estratégia tem assinatura única — escada
  ≠ renda ≠ multiplicação ≠ holding.
- **Zero risco financeiro**: 0 mudanças em `@/core/finance` ou hooks.
- **Performance**: 0 cálculos novos; redução de DOM por card.

---

## 9. Arquivos alterados

- `src/components/modules/patrimonial/strategies.ts` — assinaturas refinadas + comentários consultivos por tese.
- `src/test/patrimonialKpiSignatures.test.ts` — novo, trava as 6 assinaturas.

## 10. Próximas ondas sugeridas

- Mapear KPIs de **Operações Estruturadas** e **Comparador** sob mesma régua.
- Revisar `decisionDeskInsights` para garantir narrativas coerentes com novas assinaturas.
