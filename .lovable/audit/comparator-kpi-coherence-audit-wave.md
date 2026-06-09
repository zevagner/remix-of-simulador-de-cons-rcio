# Auditoria — Coerência de KPIs no Comparador Financeiro

**Wave:** comparator-kpi-coherence
**Data:** 2026-05-15
**Escopo:** `ConsortiumComparisonTab`, `FinancingComparisonTab`

---

## 1. Diagnóstico

Três pontos onde o Comparador exibia KPIs/mensagens inconsistentes com a alternativa realmente comparada:

| # | KPI/Mensagem | Problema | Aba |
|---|---|---|---|
| 1 | "X é R$ 0,00 mais barato" | Empate técnico (totais iguais) gerava veredito sem sentido | Consórcio × Consórcio |
| 2 | "Diferença estimada vs PRICE/SAC" | Aparecia mesmo quando entrada cobre 100% (`financingBase = 0`) — não há financiamento a comparar | Consórcio × Financiamento |
| 3 | "Comparativo com Prazo de 420 Meses" | Renderizava mesmo quando o consórcio já está em 420m → bloco duplicado | Consórcio × Financiamento |

Outros KPIs **já protegidos** e mantidos (regressão coberta nos testes):
- "Lance Ofertado" só aparece quando há lance livre ou embutido
- "Custo real" mostra `—` quando `creditoLiquido = 0`
- "Você recebe / Você paga" sempre presentes (visão consultiva canônica)
- Toggle "Usar lance livre como entrada" desabilitado quando não há lance livre
- "Considerar correção TR" / "INCC/IPCA" toggles default OFF + badge XOR de assimetria

---

## 2. Implementação

### `ConsortiumComparisonTab.tsx`
Lógica de veredito reescrita com tolerância de R$ 1,00:
```ts
if (Math.abs(diff) < 1) return 'Custo equivalente entre os dois cenários';
return diff > 0
  ? `${option1.name} é ${formatCurrency(diff)} mais barato`
  : `${option2.name} é ${formatCurrency(-diff)} mais barato`;
```

### `FinancingComparisonTab.tsx`
- Bloco "Diferença vs PRICE/SAC" agora condicional a `financingBase > 0`. Quando entrada cobre 100% do bem, mostra mensagem consultiva: *"A entrada cobre 100% do valor do bem — não há financiamento a comparar."*
- Bloco "Comparativo 420 meses" agora condicional a `termMonths !== 420 && financingBase > 0`.

---

## 3. Testes — `src/test/comparatorKpiCoherence.test.tsx`

9 invariantes (todos verdes):

**ConsortiumComparisonTab — veredito**
1. Empate (`diff < R$ 1`) → "Custo equivalente"
2. Consórcio 1 mais barato quando totalCost menor
3. Consórcio 2 mais barato quando totalCost maior
4. Nunca exibe "R$ 0,00 mais barato" (regressão da bug original)

**FinancingComparisonTab — KPIs condicionais**
5. Diferença PRICE/SAC visível quando `financingBase > 0`
6. Diferença PRICE/SAC oculta + mensagem fallback quando `financingBase = 0`
7. Bloco 420m visível quando `termMonths !== 420` e há financiamento
8. Bloco 420m oculto quando `termMonths === 420` (evita duplicação)
9. Bloco 420m oculto quando não há financiamento real

---

## 4. Escopo preservado

- ✅ Sem mudanças em motores financeiros (`@/core/finance`)
- ✅ Sem mudanças em hooks/contextos do simulador
- ✅ Cards de input, toggles INCC/TR/lance, gráficos e tabela detalhada intactos
- ✅ Card consultivo "Você recebe / Você paga / Custo real" intacto
- ✅ PDF (`PdfAnaliseFinanceira`) recebe os mesmos campos — narrativa institucional preservada

---

## 5. Não tocado (deliberado)

- **`comparisonType: 'cash'`** — referenciado em `comparisonLabels` e `getPrintSummaryItems` no `ComparatorModule`, mas sem `TabsTrigger` correspondente. É código defensivo dormente; remoção pertence a outra wave de cleanup, não de coerência de KPIs.
- **Tabela detalhada** mantida sempre visível (collapsible) — sua utilidade é auditoria mensal, não comparação de KPIs.

---

## Arquivos modificados

- `src/components/modules/comparator/ConsortiumComparisonTab.tsx` (veredito com guarda de empate)
- `src/components/modules/comparator/FinancingComparisonTab.tsx` (guardas em diferença PRICE/SAC e bloco 420m)
- `src/test/comparatorKpiCoherence.test.tsx` (novo, 9 testes)
