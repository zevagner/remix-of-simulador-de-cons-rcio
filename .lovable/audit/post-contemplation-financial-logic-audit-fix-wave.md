# Post-Contemplation Financial Logic Audit & Fix Wave

**Data:** 2026-05-15
**Escopo:** Card "Cenário Pós-Contemplação" (`SimulatorContemplationCard`) — opções `Reduzir parcela mensal` × `Reduzir prazo restante` no fluxo de **contemplação por lance**.
**Severidade:** Alta — inversão visual da lógica financeira ao consultor.

---

## 1. Sintoma reportado

No card "Cenário Pós-Contemplação", ao selecionar **"Reduzir parcela mensal"**, a Nova Parcela exibida ficava **MAIOR** do que a exibida ao selecionar **"Reduzir prazo restante"** — invertendo a expectativa consultiva:

| Opção | Esperado | Observado (bug) |
|---|---|---|
| Reduzir parcela mensal | parcela menor, prazo igual | parcela "média" |
| Reduzir prazo restante | parcela ≈ cheia, prazo menor | **parcela residual truncada (menor ainda)** |

---

## 2. Auditoria do fluxo

Camadas inspecionadas (sem alterações exigidas exceto onde indicado):

| Camada | Arquivo | Status |
|---|---|---|
| UI (toggle/select) | `SimulatorContemplationCard.tsx` | ✅ correto — mapa direto label → enum |
| Estado | `SimulatorContext.tsx` (linhas 250, 526, 552) | ✅ correto — `postContemplationChoice` propaga como `postLanceChoice` |
| Engine legado (agregado) | `core/finance/internal/calculations.ts` (linhas 250–259) | ✅ correto — `reduce-term` usa `fullInstallment`; `reduce-installment` usa `debt/remainingTerm` |
| Engine mensal (canônico) | `core/finance/internal/monthlySchedule.ts` (linhas 278–285) | ✅ correto — `postBidInstallment` calculado conforme branch |
| **Reconciliação** | `core/finance/internal/reconcile.ts` (linhas 88–90, **antes**) | ❌ **BUG** — pegava `lastPaidRow.payment` |

---

## 3. Causa raiz

`reconcileWithSchedule` projetava `installmentAfterContemplation` no `SimulationResult` final usando a **última linha paga** do schedule mensal:

```ts
const lastPaidRow = [...schedule.rows].reverse().find((r) => r.baseInstallment > 0);
const installmentFromSchedule = lastPaidRow?.payment ?? result.installmentAfterContemplation;
```

No cenário **`reduce-term`**, o motor mensal encerra cedo quando o saldo zera (linha 353: `if (balanceEnd <= 0.01) earlyTerminate = true`). A última parcela é **truncada ao saldo residual** (`if (baseInstallment > balanceAfterBid) baseInstallment = balanceAfterBid`), produzindo um valor pequeno (fração da parcela cheia).

Resultado: o reconcile substituía a parcela canônica do regime `post-bid` (ex.: R$ 1.840) pela parcela **residual truncada** (ex.: R$ 312), invertendo a comparação visual contra `reduce-installment` (ex.: R$ 1.420 — distribuído, mas constante).

---

## 4. Correção aplicada

**Arquivo:** `src/core/finance/internal/reconcile.ts`

A reconciliação agora **isola as linhas do regime `post-bid`** e usa a **parcela representativa** (máxima entre as post-bid). Para `reduce-installment`, todas as post-bid são iguais (até reajuste anual), então o resultado é estável. Para `reduce-term`, a primeira post-bid é a parcela cheia e a residual é descartada — eliminando o truncamento.

```ts
const postBidRows = schedule.rows.filter((r) => r.regime === 'post-bid' && r.baseInstallment > 0);
let installmentFromSchedule: number;
if (postBidRows.length > 0) {
  installmentFromSchedule = postBidRows.reduce((max, r) => Math.max(max, r.payment), 0);
} else {
  const lastPaidRow = [...schedule.rows].reverse().find((r) => r.baseInstallment > 0);
  installmentFromSchedule = lastPaidRow?.payment ?? result.installmentAfterContemplation;
}
```

**Fallback preservado** para todos os cenários sem regime post-bid (sorteio, none, sorteio com `keep-reduced-credit-adjusted` via `preserveContemplationInstallment`).

---

## 5. Validação

### 5.1 Suite financeira completa
- **421/422 testes passando** (a única falha é pré-existente e não relacionada — `antiXssGovernance`).
- ✅ `installmentSingleSourceOfTruth` — sem drift entre Resultados/Composição/PDF.
- ✅ `simulationResultGoldenSnapshot` — nenhuma mudança de byte na engine.
- ✅ `monthlyScheduleAdjustment`, `baseScheduleInvariance`, `simulatorContextParity` — paridade preservada.

### 5.2 Teste de regressão dedicado (novo)
**Arquivo:** `src/test/postContemplationChoiceCoherence.test.ts` — **6/6 verdes**.

Cenários cobertos:
1. `reduce-installment` < `reduce-term` (assinatura da inversão original).
2. `reduce-term` ≈ `fullInstallment` (tolerância ±10%).
3. `reduce-term.remainingTerm` < `reduce-installment.remainingTerm`.
4–6. Coerência preservada em 3 perfis reais (imob 150k/120m, imob 500k/200m, auto 80k/80m).

---

## 6. Coerência consultiva final (validada)

| Opção | Parcela | Prazo restante |
|---|---|---|
| **Reduzir parcela mensal** | menor (saldo / prazo restante) | mantido |
| **Reduzir prazo restante** | ≈ parcela cheia | encurtado (saldo / parcela cheia) |

A leitura visual no card "Cenário Pós-Contemplação" agora reflete exatamente o que o consultor narra ao cliente.

---

## 7. Arquivos alterados

- ✏️ `src/core/finance/internal/reconcile.ts` — bugfix em `installmentFromSchedule`.
- ➕ `src/test/postContemplationChoiceCoherence.test.ts` — regressão.
- ➕ `.lovable/audit/post-contemplation-financial-logic-audit-fix-wave.md` — este relatório.

## 8. Impacto na confiança consultiva

Antes: o consultor via números invertidos e precisava recalcular mentalmente, perdendo autoridade. Agora a UI confirma a tese financeira ("quem reduz prazo paga parcela cheia mais tempo curto; quem reduz parcela alivia o caixa diluindo no prazo"), restaurando a coerência narrativa essencial para fechamento.
