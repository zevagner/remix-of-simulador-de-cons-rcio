# Auditoria — Relevância de KPIs em Operações Estruturadas

**Wave:** structured-ops-kpi-relevance
**Data:** 2026-05-15
**Escopo:** `StructuredOpsConsolidated`, gráfico "Comparação de Parcelas" em `StructuredOpsCharts`

---

## 1. Diagnóstico

O card **Resultado Consolidado** exibia 12 KPIs em 3 blocos fixos, mesmo quando vários eram redundantes ou nulos. O gráfico **Comparação de Parcelas** era sempre renderizado, mesmo quando inicial = pós-contemplação.

### KPIs com problema de coerência consultiva

| KPI | Problema | Quando vira ruído |
|---|---|---|
| **Lance Total** (bloco 1) | Sempre R$ 0,00 sem lance | `totalBid === 0` |
| **Parcela Pós Contemplação** (bloco 1) | Idêntica à Parcela Inicial | `|pós − inicial| < 0,01` |
| **Lance Recursos Próprios** (bloco 2) | R$ 0,00 sem lance livre | `freeBidValue === 0` |
| **Lance Embutido** (bloco 2) | R$ 0,00 sem lance embutido | `embeddedBidValue === 0` |
| **Crédito Disponível** (bloco 2) | Igual a "Total das Cartas" sem embutido | `embeddedBidValue === 0` |
| **Valor Emprestado** (bloco 2) | Igual a "Total das Cartas" sem lance | `totalBid === 0` |
| **Bloco 2 inteiro** | Sem lance, é só repetição do bloco 1 | `totalBid === 0` |
| **Gráfico "Comparação de Parcelas"** | Duas barras idênticas | parcelas iguais |

### Bloco 3 (Custos) — sem alteração
`Custo das Taxas`, `Taxa Total` e `Qtde. Total de Cotas` permanecem sempre visíveis (são a assinatura institucional do consórcio, sempre relevantes).

### Tabela `StructuredOpsResultsTable` — preservada
Tabela por carta mantém células com R$ 0,00 propositalmente: a comparabilidade linha-a-linha entre cartas exige colunas estáveis. Não é ruído — é grade analítica.

### Charts já protegidos
`bidChartData` e `costChartData` já usavam `.filter(value > 0)`. Mantidos.

---

## 2. Implementação

### `StructuredOpsConsolidated.tsx` — refator para itens condicionais
- Substituído por estrutura `KpiItem[]` + componente `KpiBlock` interno.
- Grid responsiva dinâmica via `GRID_BY_COUNT[1..6]` — sem colunas órfãs.
- Bloco 2 só monta se `totalBid > 0`; cada item dentro dele tem guarda própria.
- Bloco 1 só inclui "Parcela Pós Contemplação" se diferir de "Parcela Inicial".

### `StructuredOperationsModule.tsx` — `installmentChartData`
- Retorna `[]` quando `|pós − inicial| < 0,01`.
- O componente já renderizava placeholder quando array vazio (após ajuste em `StructuredOpsCharts`).

### `StructuredOpsCharts.tsx` — fallback do gráfico de parcelas
- Adicionado branch `installmentChartData.length > 0 ? <BarChart/> : <empty state>` com mensagem consultiva: *"Sem lance configurado — parcela inicial e pós-contemplação são idênticas."*

---

## 3. Cenários por configuração

| Cenário | KPIs visíveis (bloco 1) | Bloco 2 | Gráfico parcelas |
|---|---|---|---|
| Sem lance | Total Cartas / Parc. Inicial / Total a Pagar (3 cols) | oculto | placeholder |
| Só lance livre | + Lance Total + Parc. Pós (5 cols) | Lance Rec. Próprios + Valor Emprestado (2 cols) | renderizado |
| Só lance embutido | + Lance Total + Parc. Pós (5 cols) | Lance Embutido + Crédito Disp. + Valor Emprestado (3 cols) | renderizado |
| Lance livre + embutido | + Lance Total + Parc. Pós (5 cols) | 4 itens completos | renderizado |

---

## 4. Testes (`src/test/structuredOpsKpiRelevance.test.tsx`)

7 invariantes (todos verdes):
1. `Lance Total` ausente quando `totalBid = 0`
2. Bloco de composição inteiro ausente quando `totalBid = 0`
3. `Parcela Pós Contemplação` ausente quando idêntica à inicial
4. Todos os KPIs de lance presentes quando há lance completo
5. `Crédito Disponível` ausente quando há só lance livre
6. `Lance Recursos Próprios` ausente quando há só lance embutido
7. Bloco de custos sempre visível (regressão)

---

## 5. Escopo preservado

- ✅ Sem mudanças em motores financeiros (`@/core/finance`)
- ✅ Sem mudanças em `calculateCardResult` ou tipos
- ✅ Tabela por carta intacta (grade analítica preservada)
- ✅ PDF (`PdfOperacoesEstruturadas`) recebe os mesmos dados consolidados — narrativa institucional preservada
- ✅ Gráficos `bidChartData` e `costChartData` mantêm filtros existentes

---

## 6. Impacto consultivo

- **Cenário sem lance** (uso típico de planejamento inicial): card consolidado passa de 12 KPIs em 3 blocos para 5 KPIs em 2 blocos — **−58% de ruído**.
- **Cenário com lance completo**: zero perda de informação, mesma densidade.
- Hierarquia executiva preservada: `primary` (xl/bold) para headline, `secondary` (lg/semibold) para composição e custos.

---

## Arquivos modificados

- `src/components/modules/structured-ops/StructuredOpsConsolidated.tsx` (refator condicional)
- `src/components/modules/StructuredOperationsModule.tsx` (`installmentChartData` com guarda)
- `src/components/modules/structured-ops/StructuredOpsCharts.tsx` (fallback do gráfico de parcelas)
- `src/test/structuredOpsKpiRelevance.test.tsx` (novo, 7 testes)
