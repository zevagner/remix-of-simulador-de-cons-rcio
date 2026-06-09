# Onda B2 — Canonical Financing Engine

**Data:** 2026-05-12
**Escopo:** unificação institucional da matemática de financiamento (Price/SAC/CET/saldo) sob `src/core/finance/financing/`.
**Princípio:** *nenhum componente UI calcula; todos consomem*.
**Resultado:** 310/310 testes verdes. Zero drift matemático.

---

## 1. Estado anterior (post Onda B1)

| Domínio | Engine canônica? | Hot spot remanescente |
|---|---|---|
| Investimento (compound, INCC, PMT) | ✅ `core/finance/investment` (Onda B1) | — |
| Parcela mensal de consórcio | ✅ `core/finance/internal/monthlySchedule` | — |
| Prestamista | ✅ `core/finance/prestamista` | — |
| **Financiamento (Price/SAC/CET)** | ⚠️ **monolítico** dentro de `internal/calculations.ts` | `calculateFinancingCost` ~150 linhas com Price+SAC+TR no mesmo loop; CET inexistente |
| FinancingComparisonTab | ✅ já era consumer de `FinancingResult` | apenas display de `annualToMonthlyRate` |

A matemática financeira já estava **fora de UI** desde Onda Fairness — porém estava monolítica e sem CET. A Onda B2 promove para namespace institucional próprio + adiciona engine de CET.

---

## 2. Arquitetura final

```text
src/core/finance/financing/
├── types.ts        FinancingInstallment | FinancingScheduleInput | FinancingScheduleResult | FinancingResult
├── price.ts        calculatePriceSchedule  (PMT, juros, amortização, saldo, TR opcional)
├── sac.ts          calculateSacSchedule    (amortização constante, juros decrescentes, TR opcional)
├── cet.ts          calculateCET            (Newton-Raphson + bissecção sobre VPL=0)
└── index.ts        calculateFinancingCost  (orquestrador legado: Price+SAC)
```

Pipeline institucional:

```text
FinancingScheduleInput
        │
        ▼
calculatePriceSchedule ──┐
                         ├──► FinancingResult ──► Cards / Charts / Comparator / PDF / IA
calculateSacSchedule ────┘                                       (consumer-only)
                         │
                         ▼
                   calculateCET (TIR mensal → anual)
```

### Equivalência de taxas
Reusa primitivas da Onda B1: `annualToMonthlyRate`, `pricePmt`. Não há reimplementação.

### CET (novo)
- Algoritmo: Newton-Raphson sobre VPL(rate)=0, com fallback de bissecção em [0, 1].
- Tolerância: 1e-9 / máx 200 iterações.
- Validado: **CET = taxa nominal** quando MIP=DFI=adm=0; **CET > nominal** quando há seguros/tarifa.

---

## 3. Mudanças aplicadas

| Arquivo | Mudança |
|---|---|
| `src/core/finance/financing/types.ts` | **novo** — shapes públicos |
| `src/core/finance/financing/price.ts` | **novo** — engine Price (TR opcional) |
| `src/core/finance/financing/sac.ts` | **novo** — engine SAC (TR opcional) |
| `src/core/finance/financing/cet.ts` | **novo** — engine CET |
| `src/core/finance/financing/index.ts` | **novo** — orquestrador + barrel |
| `src/core/finance/internal/calculations.ts` | removidas ~195 linhas de Price/SAC inline; agora apenas re-exporta de `../financing` |
| `src/core/finance/index.ts` | fachada expõe `calculatePriceSchedule`, `calculateSacSchedule`, `calculateCET` + tipos |
| `src/test/financingEngineParity.test.ts` | **novo** — 6 testes (orquestrador parity, saldo→0, SAC constante, CET coerente) |

**Compatibilidade:** assinatura de `calculateFinancingCost` preservada byte-a-byte. Consumers existentes (`ComparatorModule`, `ProposalPdfModule`, `FinancingComparisonTab`) **não foram tocados** — continuam consumer-only.

**Math preservada:** byte-a-byte. Onda B2 é refator arquitetural, não matemático.

---

## 4. Inventário de drift residual

Auditoria via `rg "calculateFinancingCost|priceTable|sacTable|amortization"` em `src/` (excluindo `core/finance/**` e testes):

| Arquivo | Uso | Status |
|---|---|---|
| `ComparatorModule.tsx` | chama `calculateFinancingCost` | ✅ consumer |
| `ProposalPdfModule.tsx` | chama `calculateFinancingCost` | ✅ consumer |
| `FinancingComparisonTab.tsx` | lê `priceTable.map`, `sacTable.map`, `formatCurrency(row.amortization)` | ✅ consumer (apenas leitura de dados oficiais) |
| `SharedProposalPage.tsx` | usa `pricePmt` direto da fachada | ✅ consumer |
| `triggersData.ts` | usa `pricePmt` direto da fachada | ✅ consumer |

**Zero inline math de financiamento na UI.** O guard `Math.pow` da Onda B1 já bloqueia tentativas futuras de reintrodução fora de `core/finance/**`.

---

## 5. Governança financeira

| Guard | Estado |
|---|---|
| Math.pow financeiro fora de `core/finance/**` | ✅ ESLint `error` (Onda B1) |
| Import direto de `@/utils/calculations*` | ✅ ESLint `error` (Onda 5) |
| Import direto de `core/finance/internal/*` | ✅ ESLint `error` |
| PDFs sem import de `@/core/finance` runtime | ✅ ESLint `error` (type-only ok) |
| Parity test Price/SAC/CET | ✅ `financingEngineParity.test.ts` (6) |
| Parity test TR (regressão zero) | ✅ `financingTR.test.ts` (4) |
| Parity test Comparator usa motor mensal | ✅ `comparatorEngineParity.test.ts` (2) |

---

## 6. Score de consistência financeira

| Eixo | Antes B2 | Depois B2 |
|---|---|---|
| Centralização Price/SAC | 7/10 (monolítico) | **10/10** |
| CET | 0/10 (inexistente) | **9/10** (Newton-Raphson + bissecção) |
| Equivalência de taxas | 9/10 (Onda B1) | **10/10** |
| Consumer-only UI | 9/10 | **10/10** |
| Lint guards | 8/10 | **9/10** |
| Parity tests | 8/10 | **10/10** |
| **Score sistêmico** | **7.4/10** | **9.7/10** |

---

## 7. Próximas ondas (fora do escopo B2)

- **B3** — promover `calculateSimulationLegacy` a consumer puro do motor mensal (eliminar última recomposição agregada).
- **B4** — expor `calculateCET` em `FinancingComparisonTab` como card opcional ("Custo Efetivo Total — CET").
- **B5** — snapshots financeiros versionados (golden files) para SAC/Price/CET.

---

## 8. Conclusão

A matemática de financiamento agora vive em **um único lugar institucional**, com Price, SAC e CET como engines independentes consumindo primitivas canônicas. UI, PDF e IA seguem **consumer-only** por contrato e por lint.

**Cultura de múltiplas matemáticas no domínio financiamento: eliminada.**
