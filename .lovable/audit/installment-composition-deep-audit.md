# Auditoria Profunda — Composição da Parcela × Parcela Oficial

**Status:** Diagnóstico (NÃO corrigir ainda)
**Data:** 2026-05-12
**Escopo:** Simulador → card "Resultados da Simulação" × card "Composição da parcela" × PDF × IA
**Autor:** Principal Financial Engineer

---

## 1. TL;DR — Veredicto

**Existe drift matemático real entre a parcela exibida no card de Resultados e a soma da tabela de Composição.**

A causa raiz é arquitetural e tem **três engines paralelas convivendo** no caminho da parcela:

1. **Legacy** (`calculateSimulation` em `src/core/finance/internal/calculations.ts`) — saldo CONSTANTE, prêmio = `crédito × rate × prazo`.
2. **Atuarial mensal** (`calculateMonthlySchedule`) — saldo DECRESCENTE, prêmio sobre saldo devedor real.
3. **Composição local** (`InstallmentCompositionTable.tsx`) — recompõe um `fullInstallment` próprio a partir de `result.adminFee + result.reserveFund + monthlyInsurance × termMonths`.

A reconciliação (`reconcileWithSchedule`) corrige `totalCost`, `insuranceTotal` e `monthlyInsurance` do `SimulationResult`, **mas NÃO corrige `fullInstallment`**. Isso produz duas verdades:

| Origem | Fórmula efetiva da parcela |
|---|---|
| Card **Resultados** (`result.fullInstallment`) | `(credit + adminFee + reserveFund + creditValue × rate × N) / N`  *(legado, saldo constante)* |
| Card **Composição** (`totalPlan / termMonths`) | `(credit + adminFee + reserveFund + monthlyInsuranceAvg × N) / N`  *(monthlyInsuranceAvg vem do schedule real)* |

Quando o seguro está habilitado e `personType=PF`, **as duas divergem** — a diferença é exatamente `(insuranceLegacy − insuranceSchedule) / N` por parcela. Em prazos longos com saldo decrescente real, isso pode chegar a **dezenas de reais por parcela**.

**Score de consistência matemática: 6.2 / 10.**

---

## 2. Engine principal da parcela — onde nasce

```
Input do usuário
   │
   ▼
SimulatorContext.tsx (linha ~570-600)
   ├── monthlySchedule = calculateMonthlySchedule(...)         ← motor atuarial (verdade financeira)
   ├── legacy           = calculateSimulation(...)             ← motor legado (cenários pós-contemplação)
   └── result           = reconcileWithSchedule(legacy, monthlySchedule, term)
                          │
                          ├── result.totalCost          ← schedule.costWithInsurance       ✅ reconciliado
                          ├── result.insuranceTotal    ← schedule.totalInsurance          ✅ reconciliado
                          ├── result.monthlyInsurance  ← totalInsurance / termMonths      ✅ reconciliado
                          ├── result.fullInstallment   ← (legado, NÃO reconciliado)       ❌ DRIFT
                          ├── result.reducedInstallmentValue  ← legado × 0.7              ❌ herda drift
                          └── result.redilutedInstallmentValue ← legado                    ❌ herda drift
```

**Arquivos:**
- `src/components/modules/simulator/SimulatorContext.tsx:524-660`
- `src/core/finance/internal/calculations.ts:139-162` (origem do `fullInstallment`)
- `src/core/finance/internal/reconcile.ts:36-61` (reconciliação parcial)

A "parcela oficial" exibida no card Resultados (`SimulatorResultsSection.tsx:217`) lê **`fullInstallment` do legado**, não derivada do schedule.

---

## 3. Origem do card Composição da Parcela

Arquivo: **`src/components/modules/simulator/InstallmentCompositionTable.tsx`**

Recompõe sua própria realidade financeira:

```ts
// linhas 84-95
const adminFeeTotal       = result.adminFee;
const reserveFundTotal    = result.reserveFund;
const monthlyInsurance    = insuranceEnabled ? result.monthlyInsurance : 0;
const totalPlan           = creditValue + adminFeeTotal + reserveFundTotal
                          + (monthlyInsurance * termMonths);     // ⚠️ fórmula paralela
const fullInstallment     = totalPlan / termMonths;              // ⚠️ NÃO usa result.fullInstallment
```

Em seguida, **toda a tabela é construída sobre esse `fullInstallment` local**, não sobre o `result.fullInstallment` do contexto. O footer soma `commonFundValue×months + adminFee×months + reserveFund×months + insuranceTotal` para o "total geral do plano".

### Por que diverge

`result.monthlyInsurance` (após reconcile) = `schedule.totalInsurance / N`
→ `monthlyInsurance × N` = `schedule.totalInsurance` (saldo decrescente real)

`result.fullInstallment` (legado, não reconciliado) usa `creditValue × rate × N` (saldo constante)

**As bases de seguro são DIFERENTES**, logo:
- `tabela.fullInstallment ≠ result.fullInstallment` quando `insuranceEnabled=true`.
- Os totais do footer (`grandTotal`) ≠ `result.totalCost`? **Não** — coincidem com `costWithInsurance` real, **mas a parcela exibida no card Resultados continua errada para essa nova base**.

---

## 4. Mapa de dependências

```
calculateMonthlySchedule  ───┐
calculateSimulation (legado)─┼──► reconcileWithSchedule ──► result (Context)
                             │                                │
                             │                                ├──► SimulatorResultsSection
                             │                                │      └─► exibe result.fullInstallment    [VERDADE A]
                             │                                │
                             │                                ├──► InstallmentCompositionTable
                             │                                │      └─► RECALCULA fullInstallment local [VERDADE B]
                             │                                │
                             │                                ├──► PdfSimulador
                             │                                │      └─► passa firstRow.payment do schedule [VERDADE C]
                             │                                │
                             │                                └──► Central AI / Cockpit
                             │                                       └─► consome result.fullInstallment   [VERDADE A]
                             │
                             └──► (motor mensal) ──► firstRow.payment ≠ result.fullInstallment normalmente
```

**Três verdades convivem na mesma simulação.**

---

## 5. Fórmula real usada vs. esperada

| Quem | Fórmula | Base de seguro |
|---|---|---|
| `result.fullInstallment` (card Resultados) | `(C + Adm + FR + C·r·N) / N` | constante |
| `InstallmentCompositionTable.fullInstallment` | `(C + Adm + FR + insAvg·N) / N` | derivada do schedule (decrescente) |
| `monthlySchedule.rows[i].payment` | atuarial real, varia por mês (PTA, lance, reajuste) | saldo devedor mensal |
| `PdfSimulador.initialInstallmentLabel` | `firstRow.payment` do schedule | atuarial real |

**Esperado:** uma única fonte (motor atuarial) — todas as superfícies derivam dela.

---

## 6. PTA × FC behavior (linearidade)

A tabela **modela corretamente** a antecipação para Veículos (9m × 0,6012%), Pesados (9m × 0,6012%) e Imobiliário (27m × 0,2134% / 24m × 0,17% com reduzida):

- PTA antecipada → FC absorve o resto para manter parcela linear (`commonFundAdvancePeriod = fullInstallment − advAdmin − reserveFund − monthlyInsurance`).
- Após PTA, FC cresce porque adminFeeNormal cai → linha 2 mostra `fullInstallment` igual.

✅ **Linearidade da prestação preservada na tabela** — desde que o `fullInstallment` local seja a verdade. Mas como ele é uma SEGUNDA verdade, a linearidade que a tabela mostra não é a linearidade que o card Resultados informa.

O motor mensal (`monthlySchedule`), em contraste, **não modela PTA** — distribui Adm linearmente por mês. Logo, `firstRow.payment` do schedule também difere da tabela em consórcios com antecipação.

→ **Quarta verdade implícita**: a linearidade do schedule mensal não respeita a antecipação de taxa do produto CAIXA.

---

## 7. Saldo devedor

- **Schedule mensal:** saldo devedor real, lance abate antes da amortização, seguro sobre saldo médio (saldo devedor decrescente). ✅
- **Legado (`calculateSimulation`):** seguro sobre crédito constante. Saldo devedor implícito linear. ❌ irreal.
- **Tabela Composição:** não modela saldo devedor — usa `monthlyInsurance` médio constante. Saldo é abstrato.

---

## 8. Arredondamentos

- Nenhum `toFixed`/`round` no caminho de cálculo da tabela ou do legado — toda divisão é float.
- `formatCurrency` arredonda apenas para exibição (`Intl.NumberFormat`).
- **Divergência observada NÃO é arredondamento** — é estrutural (engines diferentes).

Risco de centavos: somatório `Σ commonFundValue·months + ...` pode acumular ε de ponto flutuante (~10⁻⁹), irrelevante.

---

## 9. Múltiplas engines / código paralelo

| Local | Tipo | Status |
|---|---|---|
| `calculateMonthlySchedule` | atuarial mensal | ✅ canônico |
| `calculateSimulation` (legado) | agregado, saldo constante | ⚠️ usado, parcialmente reconciliado |
| `InstallmentCompositionTable` (totalPlan local) | composição paralela | ❌ engine paralela escondida |
| `structuredOpsConstants.calculateCardResult` | cards Operações Estruturadas | (separado, fora do escopo deste card) |
| `comparator/investment` | usam `calculateSimulationLegacy` | fora do escopo |

**Engine paralela confirmada:** `InstallmentCompositionTable` linha 92-95.

---

## 10. Veículos × Pesados (80m / 100m)

| Cenário | PTA tabela | PTA schedule | Drift |
|---|---|---|---|
| Auto 80m, R$80k, sem seguro | 9m × 0,6012% | linear | parcela tabela ≠ firstRow |
| Pesados 100m, R$300k, sem seguro | 9m × 0,6012% | linear | parcela tabela ≠ firstRow |
| Imob 200m, R$450k, sem seguro | 27m × 0,2134% | linear | parcela tabela ≠ firstRow |
| Imob 200m, R$450k, COM seguro | 27m × 0,2134% + insAvg | linear + insReal | drift duplo |

Para os snapshots determinísticos de `simulatorContextParity.test.ts.snap` (todos sem seguro nos 3 cenários), `firstPayment === totalCost / N` apenas porque seguro=0 e PTA não é modelada no schedule. **Sem seguro, sem PTA, os números coincidem por acidente.**

---

## 11. FR 3% × 3,5%

`reserveFundPercent` é apenas um input — fluxo idêntico para 3% / 3,5%. Sem drift adicional. ✅

---

## 12. Lance embutido

- Schedule: lance abate ANTES da amortização → reduz saldo → reduz prêmio total real.
- Legado (`calculateSimulation` linhas 156-162): rediluição é matemática agregada, não por mês. `fullInstallment` NÃO depende de lance — apenas `installmentAfterContemplation`.
- Tabela Composição: `fullInstallment` local não considera lance no `totalPlan` — lance afeta apenas pós-contemplação no card "Estratégia".

✅ Tabela é consistente quanto a lance (não pretende refletir cenário pós-contemplação). ⚠️ Mas em conjunto com o item 6, a parcela "antes da contemplação" mostrada no card Resultados ainda é a do legado.

---

## 13. UI

O card de Composição **se comporta como segunda matemática paralela**, não como decomposição da parcela oficial. Sintomas:

- Footer somando linhas pode bater com `result.totalCost` (que é `schedule.costWithInsurance`) **mas** as linhas individuais usam `monthlyInsurance` médio (não o real do mês 1, mês 60, mês 180).
- Header diz "Detalhamento técnico dos componentes da parcela mensal" — mas a "parcela mensal" exibida acima vem de outra fonte.
- Usuário consultor que somar manualmente `FC + Adm + FR + Seguro` da linha 1 **NÃO vai obter** `result.fullInstallment` quando seguro habilitado em PF.

---

## 14. PDF

`PdfSimulador` (via `pdfPayload` em `SimulatorModule.tsx:74-127`) usa **uma quarta combinação**:

- `initialInstallmentLabel = formatCurrency(firstRow.payment)` — schedule
- `totalCostLabel = formatCurrency(monthlySchedule.costWithInsurance)` — schedule
- `composition[].monthlyLabel = firstRow.amortCredit / amortAdminFee / amortReserveFund / insurance` — schedule mês 1
- `composition[].totalLabel = Σ rows.amortX` — schedule

→ **PDF é internamente consistente com o motor mensal**, mas:
- **PDF mostra parcela DIFERENTE** da tela do simulador (firstRow.payment ≠ result.fullInstallment).
- PDF não modela PTA (Veículo/Imob com antecipação): cliente vê uma parcela "linear" no PDF e outra na tela.

**Sintoma duplo: tela ≠ tabela ≠ PDF.**

---

## 15. IA / Cockpit

`useCentralAI` e `salesCopilot` consomem `result.fullInstallment` e `result.totalCost` via `useProposalData()`. Conclusões:

- IA narra a parcela do **legado** (verdade A).
- WhatsApp templates usam `installment` = `result.fullInstallment` ou `reducedInstallmentValue`.
- Cockpit/Argumentos consultivos não recalculam, apenas leem.

✅ Coerência interna IA-card Resultados. ❌ Divergência IA × tabela × PDF.

---

## 16. Drift encontrado — quantificação

**Caso de teste sintético** (não executado, derivação algébrica):

```
Imob R$ 500.000, 200m, Adm 17,42%, FR 3%, MIP 0,0210%/mês PF
─────────────────────────────────────────────────────────────
Insurance LEGADO  = 500.000 × 0,000210 × 200 = R$ 21.000
Insurance SCHEDULE (saldo decrescente, aprox. metade médio)
                  ≈ 21.000 × 0,5             ≈ R$ 10.500
Drift            ≈ R$ 10.500 / 200          ≈ R$ 52,50 / parcela

result.fullInstallment             ≈ R$ 3.029,50  (mostrado no card Resultados)
InstallmentCompositionTable total  ≈ R$ 2.977,00  (mostrado no footer)
Diferença                          ≈ R$ 52,50  (1,7% por parcela)
```

Drift ESCALA com prazo e percentual de seguro. PJ (`personType=PJ`): seguro=0 em ambos → **drift=0**.

---

## 17. Inconsistências e riscos sistêmicos

| # | Inconsistência | Severidade |
|---|---|---|
| 1 | `fullInstallment` não é reconciliado em `reconcileWithSchedule` | 🔴 alta |
| 2 | `InstallmentCompositionTable` recalcula `totalPlan` local | 🔴 alta |
| 3 | PDF usa `firstRow.payment`, tela usa `result.fullInstallment` | 🟠 média |
| 4 | Motor mensal não modela PTA (antecipação Adm) | 🟠 média |
| 5 | `reducedInstallmentValue = fullInstallment × 0.7` herda drift | 🟠 média |
| 6 | IA narra `result.fullInstallment` (legado) sem flag de origem | 🟡 baixa |
| 7 | Snapshots `simulatorContextParity.test.ts.snap` não cobrem cenário com seguro PF | 🟠 média |

---

## 18. Riscos financeiros

- **Comercial:** consultor mostra parcela X na tela e X−R$50 no PDF → quebra de confiança.
- **Auditoria:** soma da composição não reconcilia com a parcela oficial → não-conformidade institucional.
- **IA:** narrativa contém valor que não confere com a tabela do mesmo PDF.
- **Onda Prestamista (anterior):** o trabalho de Ondas 1-3 corrigiu `insuranceTotal`/`totalCost` mas **não fechou o ciclo** até a parcela.

---

## 19. Before / After conceitual

### Before (atual)
```
3 motores → 3 verdades simultâneas:
  card Resultados → legado
  card Composição → reconstruído local
  PDF/IA          → schedule mensal
```

### After (proposta)
```
1 motor (monthlySchedule) → 1 fonte:
  fullInstallment   = schedule.firstRow.payment (regime base)
  reducedInstallment= schedule sob restrição reduzida
  composition       = schedule.firstRow.amort* (decomposição direta)
  PTA               = modelada DENTRO do schedule (não fora)
```

---

## 20. Estratégia segura de correção (a executar em ondas separadas)

### Onda A — Reconciliação completa de parcela (zero refator visual)
1. Estender `reconcileWithSchedule` para projetar `fullInstallment`, `reducedInstallmentValue`, `redilutedInstallmentValue` a partir do schedule.
2. Snapshots: regenerar `simulatorContextParity.test.ts.snap` com cenários incluindo seguro PF.
3. Adicionar teste E2E: `result.fullInstallment === sumOf(composition row 1 components)` para cada tipo × com/sem seguro × PF/PJ.

### Onda B — Compor da fonte (eliminar engine paralela do card)
4. `InstallmentCompositionTable` passa a receber `monthlySchedule` por prop.
5. Linhas derivam de `schedule.rows` agregadas por regime (reduzida, antecipação PTA, plena), não recalculadas.
6. Remover `totalPlan` local, remover `fullInstallment` local.

### Onda C — PTA dentro do motor mensal
7. Adicionar parâmetro `advanceFee` em `calculateMonthlySchedule`.
8. Recolocar antecipação Veículo/Imob como regra do motor (não da view).
9. Esta Onda elimina divergência tela × PDF de raiz.

### Onda D — Hardening
10. ESLint guard: bloquear `result.fullInstallment` em consumers visuais novos — usar helper canônico `getDisplayInstallment(schedule, regime)`.
11. Atualizar memory `mem://logic/simulador/motor-atuarial-mensal` com nova regra: parcela = `schedule.regimeOf(month).payment`.

---

## 21. Score final de consistência matemática

| Dimensão | Nota |
|---|---|
| Engine atuarial (monthlySchedule) | 9.5 |
| Reconciliação custo total / seguro | 9.0 |
| **Reconciliação da PARCELA** | **4.0** ❌ |
| **Tabela Composição = decomposição da parcela** | **3.5** ❌ |
| Modelagem de PTA no motor | 5.0 |
| Consistência tela × PDF | 5.5 |
| Consistência tela × IA | 8.5 |
| **Score global** | **6.2 / 10** |

---

## 22. Resposta direta às perguntas do escopo

> **O card explica a parcela ou está recalculando outra realidade?**

**Está recalculando outra realidade.** A tabela cria seu próprio `totalPlan` e `fullInstallment` a partir de inputs derivados, e por acidente esse cálculo se aproxima da verdade do schedule (reconciliada parcialmente em `monthlyInsurance`). Mas o número exibido como "parcela" no card Resultados vem do **motor legado não reconciliado** para esse campo — então **a tabela não decompõe a parcela oficial**: ela decompõe uma **terceira parcela** que não é mostrada explicitamente em nenhum lugar.

> **FC + FR + TA + Seguro reconstroem EXATAMENTE a parcela principal?**

**Não.** Reconstroem `(creditValue + adminFee + reserveFund + monthlyInsuranceAvg × N) / N`, que difere de `result.fullInstallment` (legado) por `(insuranceLegacy − insuranceSchedule) / N`. Quando seguro=0 ou PJ, coincidem.

> **Existe engine paralela?**

**Sim, três:** `calculateSimulation` (legado), `calculateMonthlySchedule` (atuarial), e o cálculo local dentro de `InstallmentCompositionTable`.

---

**Próximo passo recomendado:** aprovar Onda A (reconciliação de `fullInstallment` em `reconcileWithSchedule`) — é a correção de menor risco e maior impacto na consistência percebida pelo consultor.
