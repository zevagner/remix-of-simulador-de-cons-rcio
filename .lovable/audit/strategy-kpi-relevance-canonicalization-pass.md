# Strategy KPI Relevance & Canonicalization Pass

> Substitui a heurística "últimas 3 calculations" por um mapa canônico KPI ↔ estratégia. Cada card vira uma mini tese patrimonial mensurável, com hero KPI específico da tese e até 2 secundários relevantes. Zero alteração no motor financeiro.

---

## 1. KPI Relevance Mapping

Taxonomia canônica unificada (`strategyExecutiveKpis.ts`), alinhada à camada `strategy-v2/adapters.ts`:

| Kind | Rótulo | Quando faz sentido |
|---|---|---|
| `roi` | ROI da operação | Estratégias de venda da carta / arbitragem de curto prazo |
| `payback` | Janela de payback | Recuperação de aporte (venda da carta, solar) |
| `multiplier` | Multiplicador / Exposição patrimonial | Multiplicação de cotas, alavancagem |
| `preserved` | Capital preservado | Aquisição que mantém capital próprio líquido |
| `monthlyFlow` | Renda / fluxo mensal | Aluguel, renda passiva, autoquitação |
| `monthlySaving` | Economia / folga mensal | Solar, autoquitação |
| `annualSaving` | Economia anual | Eficiência tributária, sucessão |
| `finalPatrimony` | Patrimônio final | Compra à vista dobrada, retrofit |
| `profit` | Lucro líquido | Venda da carta |
| `installment` | Parcela mensal | Planejamento de aquisição |
| `totalCost` | Custo total do plano | Obras, equipamentos, frota |
| `coverage` | Cobertura (%) | Aluguel ÷ parcela, cap rate alvo |
| `exposure` | Exposição patrimonial agregada | Renda passiva agregada |

---

## 2. Strategy-to-KPI Alignment

Mapa completo (24 estratégias). `★` = hero KPI.

| Estratégia | Hero KPI | Secundários |
|---|---|---|
| **compra-a-vista** (Carta Dobrada) | ★ Patrimônio final | Rendimento mensal · Capital preservado |
| **compra-hibrida** | ★ Capital preservado | Rendimento mensal |
| **compra-planejada** | ★ Parcela mensal | Custo total do plano |
| **aquisicao-acelerada** | ★ Parcela pós-lance | Capital de lance |
| **leverage-patrimonial** (várias cartas) | ★ Exposição patrimonial | Parcela agregada |
| **alavancagem-imobiliaria** (aluguel) | ★ Renda de aluguel | Cobertura da parcela · Parcela mensal |
| **multiplicacao-cotas** | ★ Multiplicador patrimonial | Renda mensal por cota · Capital reinvestível |
| **escada-patrimonial** (venda da carta) | ★ ROI da operação | Lucro líquido · Janela de payback |
| **reinvestimento-estruturado** | ★ Renda anual gerada | Capital acumulado |
| **autoquitacao-estruturada** | ★ Renda mensal do ativo | Parcela ordinária · Folga mensal |
| **patrimonio-escalavel** (PJ/holding) | ★ Economia anual de IR | IR como PF |
| **holding-patrimonial** | ★ Economia anual de IR | IR como PF |
| **planejamento-sucessorio** | ★ Economia sucessória | Custo de inventário |
| **reforma-ampliacao** | ★ Custo total do plano | Valor da obra |
| **retrofit-patrimonial** | ★ Valor final do ativo | Custo da compra · Custo do retrofit |
| **energia-solar** | ★ Parcela mensal | Economia mensal · Custo total |
| **upgrade-veiculo** | ★ Parcela mensal | Custo nominal |
| **renovacao-frota** | ★ Parcela por veículo | Custo nominal |
| **expansao-produtiva** | ★ Custo total no consórcio | — |
| **equipamentos-pesados** | ★ Parcela mensal | Custo total |
| **agronegocio** | ★ Custo total no consórcio | — |
| **patrimonio-rural** | ★ Receita anual de arrendamento | Custo total no consórcio |
| **renda-passiva** | ★ Renda mensal por cota | Renda agregada (10 cotas) |
| **patrimonio-gerador-caixa** | ★ Renda mensal projetada | Cap rate alvo |

### Princípios aplicados

- **Compra à Vista** ganha `finalPatrimony` + `preserved` (tese: comprar sem queimar caixa) — não usa Payback nem ROI especulativo (irrelevantes).
- **Venda da Carta** ganha `roi` + `profit` + `payback` (tese: arbitragem de curto prazo).
- **Aluguel** ganha `monthlyFlow` + `coverage` (tese: fluxo cobre obrigação).
- **Multiplicação de Cotas** ganha `multiplier` + `monthlyFlow` (tese: alavancagem patrimonial).
- **Solar** ganha `installment` + `monthlySaving` (tese: parcela ≈ economia).
- **Sucessão / Holding** ganha `annualSaving` (tese: eficiência tributária).
- **Industrial / Frota / Equipamento** ganha `installment` ou `totalCost` (tese: previsibilidade de custo).

---

## 3. Canonical KPI Integration

- Mapa declarativo em `src/components/modules/wealth/strategyExecutiveKpis.ts` — typed (`ExecutiveKpiKind` + `ExecutiveKpiPick`).
- `Record<strategyId, ExecutiveKpiPick[]>`: cada pick é apenas `{ kind, label, calculationIndex, hero? }`.
- **Zero math novo**: o valor exibido é `strategy.calculations[calculationIndex].result(credit)` — mesma fonte que já existia. Apenas o rótulo passa a usar a taxonomia canônica.
- Hints canônicos (`EXECUTIVE_KPI_HINTS`) padronizam tooltips por tipo de KPI.
- Compatível com a camada `strategy-v2/adapters.ts` (KpiKind compartilha 5 dos tipos: roi/payback/multiplier/preserved/finalResult).

---

## 4. Executive Scanning Improvements

`ViabilityPreview` em `StrategyLibrarySection.tsx` redesenhado:

- **Hero KPI** em bloco destacado (`bg-muted/30`, valor 13px **bold**, rótulo 11px).
- **Secundários** em `dl` enxuto (11px regular).
- Truncamento elegante (`truncate` + `title`) — sem overflow.
- Ordem fixa: hero primeiro, secundários na ordem declarada.
- Mantém ícone `Calculator` + eyebrow "Indicadores da estratégia".

Resultado: ao bater o olho, o usuário lê **1 número que resume a tese** + 2 de apoio. Não há mais 3 KPIs equivalentes competindo.

---

## 5. KPI Overload Prevention

- **Limite duro: 3 KPIs por card** (1 hero + ≤2 secundários). Quem violar o limite no mapa, viola o contrato editorial.
- Estratégias com tese simples (expansao-produtiva, agronegocio) ganham **apenas 1 KPI hero** — proibido inflar.
- Métricas decorativas eliminadas: nenhum KPI é exibido por exibir.
- Texts que não viram número (`"Consultar Comparador..."`) **não são selecionáveis** como KPI canônico — o mapa só aponta para entradas com valor real.

---

## 6. Mobile KPI Validation

- Layout `grid-cols-[minmax(0,1fr)_auto]` + `truncate` em ambos os lados garante legibilidade <380px.
- Hero KPI usa `flex justify-between` + `max-w-[60%]` no valor → nunca quebra linha.
- Tamanhos tipográficos (11–13px) respeitam Mobile UX (44px targets não se aplicam aqui — é display, não touch).
- Ordem hero → secundário replica a hierarquia mental em mobile (scan vertical natural).

---

## 7. Final KPI Consistency State

| Item | Antes | Depois |
|---|---|---|
| Fonte da seleção | Heurística "últimas 3" | Mapa declarativo por estratégia |
| Variedade de KPIs por estratégia | Genérica e repetida | Específica e canônica |
| Hero KPI | Inexistente | 1 por estratégia, destacado |
| Taxonomia | Livre (label do calc) | 13 kinds canônicos |
| Tooltips | Label do calc | Hint canônico por kind |
| Drift vs adapters strategy-v2 | Total | Reconciliado (5 kinds compartilhados) |
| Math duplicada | Não havia | Continua não havendo |
| Cards iguais semanticamente | Sim (todos com "últimas 3") | Não — cada card reforça sua tese |

---

## 8. Final Verdict

Os cards agora se comportam como **mini teses patrimoniais executivas**:

- **Compra à Vista** grita "Patrimônio final" — não "Parcela".
- **Venda da Carta** grita "ROI" — não "Capital pago no mês 1".
- **Aluguel** grita "Renda mensal" + "Cobertura da parcela" — direto na tese.
- **Multiplicação** grita "Multiplicador patrimonial" — não "Capital acumulado em 60 meses".
- **Sucessão** grita "Economia sucessória" — não "ITCMD doação".

Cada KPI existe porque reforça a lógica daquela estratégia específica. A camada é **declarativa, canônica, e zero-drift** em relação ao motor financeiro.

**Próxima onda recomendada** (fora do escopo deste pass):

1. Reconciliar o mapa com `strategy-v2/blueprint.ts` para que estratégias presentes em ambos os universos compartilhem hero KPI.
2. Promover os 13 kinds canônicos a um `executiveKpiKinds.ts` neutro consumido pelas duas camadas (Wealth Library e Strategy-v2/Compare) — elimina a divergência apontada na auditoria sistêmica.
3. Pipe runtime: quando o cliente tem simulação ativa, substituir `calc.result(credit)` por valores derivados do motor canônico (`useInvestmentCalculations` / `usePatrimonialKpis`) — encerra o último vetor de drift editorial.
