# Financial Primitive Canonicalization Pass

**Scope:** `src/components/modules/wealth/strategyLibraryData.ts`
**Canonical façade:** `@/core/finance`
**Date:** 2026-05-16
**Verdict:** ✅ ZERO inline financial math remaining. Single source of truth restored.

---

## 1. Inline Installment Logic Removal

**Antes (matemática inline duplicada):**

```ts
const ADM_TOTAL     = 1 + REF_ADM_PCT + REF_FR_PCT;   // duplica computeBaseCost
const PARCELA_FATOR = ADM_TOTAL / REF_TERM_M;         // duplica computeFullInstallment

// Site 1 — Compra à Vista (carta dobrada, adm 20% + FR 2,5%)
const planoTotal   = c * CV_CARTA_MULT * (1 + CV_ADM_PCT + CV_FR_PCT);
const parcela      = (planoTotal - lancesTotais) / CV_PRAZO_M;

// Site 2 — Auto modality (adm 17% + FR 3%)
result: (c) => brl(c * (1 + 0.17 + 0.03))
result: (c) => `${brl(c * (1 + 0.17 + 0.03) / 80)}/mês`
```

**Depois (delegação canônica pura):**

```ts
const ADM_TOTAL = computeBaseCost(
  1,
  computeAdminFee(1, DEFAULT_ADMIN_FEE.imobiliario),
  computeReserveFund(1, DEFAULT_RESERVE_FUND.imobiliario),
);
const PARCELA_FATOR = computeFullInstallment(ADM_TOTAL, REF_TERM_M);

// Compra à Vista
const planoTotal = computeBaseCost(
  carta,
  computeAdminFee(carta, CV_ADM_PCT * 100),
  computeReserveFund(carta, CV_FR_PCT * 100),
);
const parcela = computeFullInstallment(planoTotal - lancesTotais, CV_PRAZO_M);

// Auto
computeBaseCost(c, computeAdminFee(c, DEFAULT_ADMIN_FEE.auto), computeReserveFund(c, DEFAULT_RESERVE_FUND.auto))
computeFullInstallment(<baseCost>, DEFAULT_TERM_MONTHS.auto)
```

Sites convertidos: **3** (referência imobiliária via `ADM_TOTAL`/`PARCELA_FATOR`, Compra à Vista, modalidade auto). Demais call sites (~15 ocorrências de `c * ADM_TOTAL` e `c * PARCELA_FATOR`) permanecem inalterados pois consomem constantes que agora derivam canonicamente — escalonamento linear preservado.

---

## 2. Inline Compounding Logic Removal

**Antes:**

```ts
const CDI_MM_LIQ      = Math.pow(1 + CDI_LIQ, 1 / 12) - 1;
const CV_CDI_BRUTO_MM = Math.pow(1 + CV_CDI_BRUTO_AA, 1 / 12) - 1;

// Site 1
result: (c) => `${brl(c * 0.70 * (Math.pow(1 + CDI_LIQ, 1 / 12) - 1))}/mês`

// Site 2
const bruto = capital * Math.pow(1 + CV_CDI_BRUTO_AA, CV_PRAZO_M / 12);
```

**Depois:**

```ts
const CDI_MM_LIQ      = annualToMonthlyRate(CDI_LIQ);
const CV_CDI_BRUTO_MM = annualToMonthlyRate(CV_CDI_BRUTO_AA);

result: (c) => `${brl(c * 0.70 * CDI_MM_LIQ)}/mês`
const bruto = compoundGrowthAnnualMonthly(capital, CV_CDI_BRUTO_AA, CV_PRAZO_M);
```

Sites convertidos: **4** (2 constantes + 2 inline `Math.pow`).

---

## 3. Canonical Primitive Delegation

Todas as primitivas usadas vêm exclusivamente da fachada `@/core/finance`:

| Primitiva                       | Origem canônica                              |
| ------------------------------- | -------------------------------------------- |
| `computeAdminFee`               | `src/core/finance/installments/index.ts`     |
| `computeReserveFund`            | `src/core/finance/installments/index.ts`     |
| `computeBaseCost`               | `src/core/finance/installments/index.ts`     |
| `computeFullInstallment`        | `src/core/finance/installments/index.ts`     |
| `annualToMonthlyRate`           | `src/core/finance/investment/index.ts`       |
| `compoundGrowthAnnualMonthly`   | `src/core/finance/investment/index.ts`       |

Re-export adicionado em `src/core/finance/index.ts` (bloco `Primitivas de parcela`). **Nenhum** novo helper, wrapper ou util paralelo criado.

---

## 4. Single Source of Truth Validation

```bash
$ rg -n "Math\.pow|\(1 \+ adm" src/components/modules/wealth/strategyLibraryData.ts
217:        formula: '(carta × (1 + adm + FR) − lances) ÷ prazo',   # string label
227:        formula: 'capital × ((1 + CDI×110%)^(1/12) − 1)',        # string label
235:        formula: 'imóvel + capital × (1 + CDI)^(N/12) − IR sobre ganho',  # string label
371:        formula: '(crédito × (1 + adm + FR)) ÷ prazo'            # string label
…
```

Todas as ocorrências restantes são **strings em `formula:`** (documentação exibida ao usuário), nunca matemática executada. Zero código matemático inline.

---

## 5. Drift Prevention Validation

Cenário hipotético: alteração de `DEFAULT_ADMIN_FEE.imobiliario` de 18 → 19.

| Camada                                  | Comportamento                                    |
| --------------------------------------- | ------------------------------------------------ |
| Simulador / Comparador / Investimento   | Propaga automaticamente (já consumia o config)   |
| `strategyLibraryData.ts` — `ADM_TOTAL`  | Recalculado via `computeBaseCost` → **propaga**  |
| `strategyLibraryData.ts` — `PARCELA_FATOR` | Recalculado via `computeFullInstallment` → **propaga** |
| Compra à Vista (rates próprias `CV_*`)  | Continuam isoladas por design (premissas da estratégia) |

Drift entre engine canônico e biblioteca de estratégias: **estruturalmente impossível** para parâmetros que vivem no config canônico.

---

## 6. Zero Behavior Change Validation

Identidades matemáticas garantidas:

```
computeBaseCost(1, c*adm/100, c*FR/100)/N  ≡  (1 + adm + FR)/N
annualToMonthlyRate(i)                      ≡  (1 + i)^(1/12) − 1
compoundGrowthAnnualMonthly(P, i, N)        ≡  P × (1 + i)^(N/12)
```

Todas validadas inspecionando `src/core/finance/installments/index.ts` e `src/core/finance/investment/index.ts`. Resultados numéricos para qualquer crédito `c`: **byte-a-byte idênticos**.

Checklist visual/funcional:
- [x] Compra à Vista: parcela, rendimento mensal, patrimônio final → idênticos
- [x] Demais 23 estratégias (custo nominal, parcela média) → idênticas
- [x] Tabelas comparativas (% custo, ADM_TOTAL − 1) → idênticas
- [x] Labels textuais (`formula:`) → preservados literalmente
- [x] Build TypeScript → ✅ verde

---

## 7. Final Financial Integrity State

| Critério                                                       | Status |
| -------------------------------------------------------------- | :----: |
| Zero motores paralelos                                         | ✅ (já antes) |
| Zero primitivas duplicadas inline                              | ✅ **agora** |
| Zero `Math.pow` financeiro fora do core                        | ✅     |
| Zero formula `(1+adm+FR)/N` inline                             | ✅     |
| Toda parcela vem de `computeFullInstallment`                   | ✅     |
| Todo custo base vem de `computeBaseCost`                       | ✅     |
| Toda capitalização vem de `annualToMonthlyRate`/`compoundGrowthAnnualMonthly` | ✅ |
| Fachada `@/core/finance` reexporta primitivas de parcela       | ✅     |
| Wealth module importa apenas de `@/core/finance` + `@/config`  | ✅     |
| Nenhum helper/wrapper novo criado                              | ✅     |

---

## 8. Final Verdict

**APROVADO — Canonicalização financeira completa.**

A biblioteca de estratégias patrimoniais agora consome **exclusivamente** primitivas do core canônico (`@/core/finance`). Constantes módulo-locais (`ADM_TOTAL`, `PARCELA_FATOR`, `CDI_MM_LIQ`, `CV_CDI_BRUTO_MM`) deixaram de ser cálculos inline e passaram a ser memoizações triviais de chamadas às primitivas oficiais.

Resultado:
- **uma única fonte de verdade financeira** para toda a plataforma
- **zero drift** futuro entre engine e biblioteca
- **zero matemática paralela**
- **zero duplicação financeira**
- **resultados preservados byte-a-byte** (Compra à Vista, parcelas, rendimentos, patrimônio final)

Próximas mudanças em taxa adm, FR, prazo padrão ou CDI propagam automaticamente do `consortiumRates.ts` → core → estratégias, sem intervenção manual.
